-- ============================================================================
-- 003_modulo3.sql — Módulo 3: Punto de venta (POS) y registro de ventas
-- Proyecto: FarmaImport, C.A.
-- La venta se registra en UNA sola transacción con registrar_venta().
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabla: clientes
-- ---------------------------------------------------------------------------
create table if not exists public.clientes (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  rif_cedula varchar(15) not null unique
             check (rif_cedula ~ '^[VEJPG]-[0-9]{6,9}(-[0-9])?$'),
  direccion  text,
  telefono   varchar(20),
  email      varchar(100),
  created_at timestamptz not null default now()
);

create index if not exists clientes_rif_idx on public.clientes (rif_cedula);

-- ---------------------------------------------------------------------------
-- Tabla: ventas (cabecera de factura)
-- ---------------------------------------------------------------------------
create table if not exists public.ventas (
  id                uuid primary key default gen_random_uuid(),
  numero_factura    varchar(20) not null unique,   -- FAC-000001
  numero_control    varchar(20) not null unique,   -- 00-000001
  cliente_id        uuid not null references public.clientes(id),
  cliente_nombre    text not null,                 -- snapshot del cliente
  cliente_rif       varchar(15) not null,          -- snapshot
  cliente_direccion text,                          -- snapshot
  vendedor_id       uuid not null references public.perfiles(id),
  subtotal          decimal(12, 2) not null default 0,  -- base imponible
  monto_exento      decimal(12, 2) not null default 0,  -- extra: total exento (E)
  porcentaje_iva    decimal(5, 2) not null default 16.00,
  monto_iva         decimal(12, 2) not null default 0,
  total             decimal(12, 2) not null default 0,
  metodo_pago       varchar(30) not null check (
                      metodo_pago in ('efectivo', 'transferencia', 'pago_movil', 'punto_de_venta')),
  estado            varchar(20) not null default 'completada'
                    check (estado in ('completada', 'anulada')),
  observaciones     text,
  anulada_por       uuid references public.perfiles(id),
  anulada_at        timestamptz,
  motivo_anulacion  text,
  created_at        timestamptz not null default now()
);

create index if not exists ventas_vendedor_idx on public.ventas (vendedor_id);
create index if not exists ventas_created_idx  on public.ventas (created_at desc);
create index if not exists ventas_estado_idx   on public.ventas (estado);

-- ---------------------------------------------------------------------------
-- Tabla: detalle_ventas (líneas de la factura con snapshots)
-- ---------------------------------------------------------------------------
create table if not exists public.detalle_ventas (
  id              uuid primary key default gen_random_uuid(),
  venta_id        uuid not null references public.ventas(id) on delete restrict,
  producto_id     uuid references public.productos(id),
  nombre_producto text not null,                    -- snapshot del nombre
  precio_unitario decimal(12, 2) not null,          -- snapshot del precio
  cantidad        integer not null check (cantidad > 0),
  subtotal        decimal(12, 2) not null,
  exento          boolean not null default false,   -- snapshot del IVA
  created_at      timestamptz not null default now()
);

create index if not exists detalle_venta_idx   on public.detalle_ventas (venta_id);
create index if not exists detalle_producto_idx on public.detalle_ventas (producto_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.clientes       enable row level security;
alter table public.ventas         enable row level security;
alter table public.detalle_ventas enable row level security;

drop policy if exists "leer clientes" on public.clientes;
create policy "leer clientes" on public.clientes
  for select to authenticated using (true);

drop policy if exists "crear clientes" on public.clientes;
create policy "crear clientes" on public.clientes
  for insert to authenticated with check (true);

drop policy if exists "editar clientes" on public.clientes;
create policy "editar clientes" on public.clientes
  for update to authenticated using (true) with check (true);

-- El cajero solo ve sus propias ventas; el administrador ve todas.
drop policy if exists "ver ventas" on public.ventas;
create policy "ver ventas" on public.ventas
  for select to authenticated
  using (vendedor_id = auth.uid() or public.es_admin());

-- El detalle hereda la visibilidad de su venta.
drop policy if exists "ver detalle" on public.detalle_ventas;
create policy "ver detalle" on public.detalle_ventas
  for select to authenticated
  using (exists (
    select 1 from public.ventas v
     where v.id = detalle_ventas.venta_id
       and (v.vendedor_id = auth.uid() or public.es_admin())
  ));

-- A propósito NO hay políticas INSERT/UPDATE/DELETE en ventas ni en detalle_ventas:
-- solo escriben registrar_venta() y anular_venta(), ambas SECURITY DEFINER.

-- ---------------------------------------------------------------------------
-- Función transaccional: registrar_venta()
--   * Bloquea la configuración (secuencias) y cada producto con FOR UPDATE.
--   * Calcula todo en la base de datos, nunca confía en el navegador.
--   * Guarda snapshots del cliente y de cada producto.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_venta(
  p_cliente_id    uuid,
  p_metodo_pago   text,
  p_items         jsonb,
  p_observaciones text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg      public.configuracion_negocio%rowtype;
  v_cli      public.clientes%rowtype;
  v_prod     public.productos%rowtype;
  v_item     jsonb;
  v_cant     integer;
  v_linea    numeric(12, 2);
  v_gravado  numeric(12, 2) := 0;
  v_exento   numeric(12, 2) := 0;
  v_iva      numeric(12, 2);
  v_venta_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  if p_metodo_pago not in ('efectivo', 'transferencia', 'pago_movil', 'punto_de_venta') then
    raise exception 'Método de pago inválido';
  end if;

  -- FOR UPDATE: la otra caja espera y recibe el número siguiente.
  select * into v_cfg from public.configuracion_negocio limit 1 for update;
  if not found then
    raise exception 'Falta la configuración del negocio';
  end if;

  select * into v_cli from public.clientes where id = p_cliente_id;
  if not found then
    raise exception 'Cliente no encontrado';
  end if;

  insert into public.ventas (
    numero_factura, numero_control, cliente_id, cliente_nombre, cliente_rif,
    cliente_direccion, vendedor_id, subtotal, monto_exento, porcentaje_iva,
    monto_iva, total, metodo_pago, observaciones
  ) values (
    'FAC-' || lpad(v_cfg.secuencia_factura::text, 6, '0'),
    '00-'  || lpad(v_cfg.secuencia_control::text, 6, '0'),
    v_cli.id, v_cli.nombre, v_cli.rif_cedula, v_cli.direccion, auth.uid(),
    0, 0, v_cfg.porcentaje_iva, 0, 0, p_metodo_pago, p_observaciones
  )
  returning id into v_venta_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_cant := (v_item ->> 'cantidad')::integer;

    select * into v_prod
      from public.productos
     where id = (v_item ->> 'producto_id')::uuid
       and activo
     for update;

    if not found then
      raise exception 'Producto no disponible';
    end if;

    if v_cant is null or v_cant <= 0 then
      raise exception 'Cantidad inválida para %', v_prod.nombre;
    end if;

    if v_prod.stock < v_cant then
      raise exception 'Stock insuficiente para % (disponible: %)', v_prod.nombre, v_prod.stock;
    end if;

    -- El precio SIEMPRE sale de la base de datos, no del navegador.
    v_linea := round(v_prod.precio_unitario * v_cant, 2);

    update public.productos
       set stock = stock - v_cant,
           updated_at = now()
     where id = v_prod.id;

    insert into public.detalle_ventas (
      venta_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal, exento
    ) values (
      v_venta_id, v_prod.id, v_prod.nombre, v_prod.precio_unitario, v_cant, v_linea, v_prod.exento
    );

    if v_prod.exento then
      v_exento := v_exento + v_linea;
    else
      v_gravado := v_gravado + v_linea;
    end if;
  end loop;

  v_iva := round(v_gravado * v_cfg.porcentaje_iva / 100, 2);

  update public.ventas
     set subtotal     = v_gravado,
         monto_exento = v_exento,
         monto_iva    = v_iva,
         total        = v_gravado + v_exento + v_iva
   where id = v_venta_id;

  update public.configuracion_negocio
     set secuencia_factura = secuencia_factura + 1,
         secuencia_control = secuencia_control + 1,
         updated_at        = now()
   where id = v_cfg.id;

  return v_venta_id;
end;
$$;

revoke execute on function public.registrar_venta(uuid, text, jsonb, text) from public, anon;
grant  execute on function public.registrar_venta(uuid, text, jsonb, text) to authenticated;
