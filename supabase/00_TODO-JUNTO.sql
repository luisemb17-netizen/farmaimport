-- ============================================================================
-- FarmaImport, C.A. — TODAS las migraciones juntas
--
--   Pega TODO este archivo en el SQL Editor de Supabase y pulsa Run UNA vez.
--   Incluye, en orden: 001, 002, 003, 004 y el seed de datos de prueba.
--
--   Es idempotente: si lo ejecutas dos veces, no rompe nada.
-- ============================================================================


-- ############################################################################
-- ##  ARCHIVO: migrations/001_modulo1.sql
-- ############################################################################

-- ============================================================================
-- 001_modulo1.sql — Módulo 1: Autenticación, roles y configuración del negocio
-- Proyecto: FarmaImport, C.A. — Facturación Digital (simulación SENIAT)
-- Ejecutar en el SQL Editor de Supabase EN ESTE ORDEN (001 → 004).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tabla: perfiles (1 a 1 con auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.perfiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  email           text,
  cedula          varchar(12),
  rol             varchar(20) not null default 'cajero'
                  check (rol in ('administrador', 'cajero')),
  activo          boolean not null default true,
  created_at      timestamptz not null default now()
);

comment on table public.perfiles is 'Perfil público de cada usuario de auth.users.';

-- ---------------------------------------------------------------------------
-- Tabla: configuracion_negocio (UNA sola fila)
-- ---------------------------------------------------------------------------
create table if not exists public.configuracion_negocio (
  id                uuid primary key default gen_random_uuid(),
  razon_social      text not null,
  rif               varchar(15) not null check (rif ~ '^[VEJPG]-[0-9]{8}-[0-9]$'),
  direccion_fiscal  text not null,
  telefono          varchar(20),
  logo_url          text,
  porcentaje_iva    decimal(5, 2) not null default 16.00
                    check (porcentaje_iva >= 0 and porcentaje_iva <= 100),
  secuencia_factura integer not null default 1 check (secuencia_factura >= 1),
  secuencia_control integer not null default 1 check (secuencia_control >= 1),
  updated_at        timestamptz not null default now()
);

comment on table public.configuracion_negocio is 'Datos fiscales del emisor. Solo puede existir una fila.';

-- Garantiza que nunca exista una segunda fila (índice único sobre una constante).
create unique index if not exists config_una_sola_fila
  on public.configuracion_negocio ((true));

insert into public.configuracion_negocio (razon_social, rif, direccion_fiscal, telefono)
select 'FarmaImport, C.A.',
       'J-00000000-0',
       'Av. Principal, Edificio FarmaImport, Caracas, Venezuela',
       '0212-0000000'
where not exists (select 1 from public.configuracion_negocio);

-- ---------------------------------------------------------------------------
-- Crear el perfil automáticamente al registrarse
-- En el registro se envían los metadatos:
--   supabase.auth.signUp({ email, password, options: { data: { nombre_completo, cedula } } })
-- ---------------------------------------------------------------------------
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre_completo, email, cedula)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre_completo', ''), new.email),
    new.email,
    new.raw_user_meta_data ->> 'cedula'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ---------------------------------------------------------------------------
-- ¿El usuario actual es administrador activo?
-- SECURITY DEFINER corta la recursión infinita de las políticas RLS de perfiles.
-- ---------------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.perfiles
     where id = auth.uid()
       and rol = 'administrador'
       and activo
  );
$$;

comment on function public.es_admin() is
  'Devuelve true si auth.uid() es un administrador activo. Se usa en políticas RLS.';

-- ---------------------------------------------------------------------------
-- Impedir que un usuario no administrador cambie su rol o su estado
-- ---------------------------------------------------------------------------
create or replace function public.proteger_rol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Cuando se ejecuta desde el SQL Editor (sin sesión) auth.uid() es null.
  if auth.uid() is not null and not public.es_admin()
     and (new.rol is distinct from old.rol or new.activo is distinct from old.activo) then
    raise exception 'Solo un administrador puede cambiar el rol o el estado';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_rol on public.perfiles;
create trigger proteger_rol
  before update on public.perfiles
  for each row execute function public.proteger_rol();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.perfiles enable row level security;
alter table public.configuracion_negocio enable row level security;

-- perfiles
drop policy if exists "ver perfil propio o admin" on public.perfiles;
create policy "ver perfil propio o admin" on public.perfiles
  for select to authenticated
  using (id = auth.uid() or public.es_admin());

drop policy if exists "editar perfil propio o admin" on public.perfiles;
create policy "editar perfil propio o admin" on public.perfiles
  for update to authenticated
  using (id = auth.uid() or public.es_admin());

-- No hay política de INSERT: el trigger crear_perfil es SECURITY DEFINER.
-- No hay política de DELETE: los usuarios no se borran, se desactivan.

-- configuracion_negocio
drop policy if exists "todos leen la config" on public.configuracion_negocio;
create policy "todos leen la config" on public.configuracion_negocio
  for select to authenticated
  using (true);

drop policy if exists "admin edita la config" on public.configuracion_negocio;
create policy "admin edita la config" on public.configuracion_negocio
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ---------------------------------------------------------------------------
-- Permisos de ejecución de las funciones
-- ---------------------------------------------------------------------------
revoke execute on function public.crear_perfil() from public, anon;
revoke execute on function public.proteger_rol() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- ============================================================================
-- PRIMER ADMINISTRADOR
-- 1) Registra el usuario desde la app (/registro).
-- 2) Ejecuta aquí (cambia el correo):
--
--   update public.perfiles
--      set rol = 'administrador'
--    where email = 'correo-del-admin@ejemplo.com';
--
-- También puedes correr el archivo 005_primer_admin.sql.
-- ============================================================================


-- ############################################################################
-- ##  ARCHIVO: migrations/002_modulo2.sql
-- ############################################################################

-- ============================================================================
-- 002_modulo2.sql — Módulo 2: Gestión de productos e inventario
-- Proyecto: FarmaImport, C.A.
-- Extensión propia de farmacia: laboratorio, presentacion y exento (IVA).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabla: categorias
-- ---------------------------------------------------------------------------
create table if not exists public.categorias (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique,
  descripcion text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tabla: productos
-- ---------------------------------------------------------------------------
create table if not exists public.productos (
  id               uuid primary key default gen_random_uuid(),
  codigo           varchar(20) not null unique,          -- SKU
  nombre           text not null,
  descripcion      text,
  laboratorio      text,                                  -- extra de farmacia
  presentacion     text,                                  -- extra de farmacia ("caja x 20")
  precio_unitario  decimal(12, 2) not null check (precio_unitario > 0),
  stock            integer not null default 0 check (stock >= 0),
  categoria_id     uuid references public.categorias(id) on delete set null,
  imagen_url       text,
  activo           boolean not null default true,
  exento           boolean not null default false,        -- true = no paga IVA, se marca (E)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on column public.productos.exento is
  'Si es true, la línea se marca (E) en la factura y no entra en la base imponible.';
comment on column public.productos.activo is
  'Un producto con ventas no se borra: se desactiva (activo = false) y desaparece del POS.';

create index if not exists productos_codigo_idx      on public.productos (codigo);
create index if not exists productos_categoria_idx   on public.productos (categoria_id);
create index if not exists productos_activo_idx      on public.productos (activo);
create index if not exists productos_nombre_trgm_idx on public.productos (lower(nombre));

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.categorias enable row level security;
alter table public.productos  enable row level security;

drop policy if exists "leer categorias" on public.categorias;
create policy "leer categorias" on public.categorias
  for select to authenticated using (true);

drop policy if exists "admin gestiona categorias" on public.categorias;
create policy "admin gestiona categorias" on public.categorias
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "leer productos" on public.productos;
create policy "leer productos" on public.productos
  for select to authenticated using (true);

drop policy if exists "admin gestiona productos" on public.productos;
create policy "admin gestiona productos" on public.productos
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ---------------------------------------------------------------------------
-- Storage: bucket público "imagenes" (lectura libre, escritura solo admin)
--
-- En Supabase estas sentencias suelen funcionar desde el SQL Editor. Si tu
-- proyecto no lo permite (el rol no es dueño de storage.objects), el bloque
-- avisa y puedes crear el bucket y sus políticas desde el panel:
--   Storage → New bucket → "imagenes" (Public)
--   Storage → Policies → permitir SELECT a todos, INSERT/UPDATE/DELETE solo admin
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    insert into storage.buckets (id, name, public)
    values ('imagenes', 'imagenes', true)
    on conflict (id) do nothing;
  exception
    when insufficient_privilege or undefined_table then
      raise notice 'AVISO: crea el bucket "imagenes" (público) desde el panel de Storage.';
  end;

  begin
    execute 'drop policy if exists "lectura publica imagenes" on storage.objects';
    execute $p$
      create policy "lectura publica imagenes" on storage.objects
        for select to public
        using (bucket_id = 'imagenes')
    $p$;

    execute 'drop policy if exists "admin sube imagenes" on storage.objects';
    execute $p$
      create policy "admin sube imagenes" on storage.objects
        for insert to authenticated
        with check (bucket_id = 'imagenes' and public.es_admin())
    $p$;

    execute 'drop policy if exists "admin cambia imagenes" on storage.objects';
    execute $p$
      create policy "admin cambia imagenes" on storage.objects
        for update to authenticated
        using (bucket_id = 'imagenes' and public.es_admin())
        with check (bucket_id = 'imagenes' and public.es_admin())
    $p$;

    execute 'drop policy if exists "admin borra imagenes" on storage.objects';
    execute $p$
      create policy "admin borra imagenes" on storage.objects
        for delete to authenticated
        using (bucket_id = 'imagenes' and public.es_admin())
    $p$;
  exception
    when insufficient_privilege or undefined_table then
      raise notice 'AVISO: crea las políticas del bucket "imagenes" desde Storage → Policies.';
  end;
end $$;


-- ############################################################################
-- ##  ARCHIVO: migrations/003_modulo3.sql
-- ############################################################################

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


-- ############################################################################
-- ##  ARCHIVO: migrations/004_modulo4.sql
-- ############################################################################

-- ============================================================================
-- 004_modulo4.sql — Módulo 4: Facturación (anulación) y reportes
-- Proyecto: FarmaImport, C.A.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Anular una venta (solo administrador). Nunca se borra: cambia de estado,
-- guarda quién, cuándo y por qué, y devuelve el stock.
-- ---------------------------------------------------------------------------
create or replace function public.anular_venta(
  p_venta_id uuid,
  p_motivo   text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede anular';
  end if;

  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'Indique el motivo de la anulación';
  end if;

  update public.ventas
     set estado           = 'anulada',
         anulada_por      = auth.uid(),
         anulada_at       = now(),
         motivo_anulacion = trim(p_motivo)
   where id = p_venta_id
     and estado = 'completada';

  if not found then
    raise exception 'La venta no existe o ya está anulada';
  end if;

  -- Devuelve el stock agrupando por producto (puede aparecer en dos líneas).
  update public.productos p
     set stock = p.stock + d.unidades,
         updated_at = now()
    from (
      select producto_id, sum(cantidad) as unidades
        from public.detalle_ventas
       where venta_id = p_venta_id
         and producto_id is not null
       group by producto_id
    ) d
   where p.id = d.producto_id;
end;
$$;

revoke execute on function public.anular_venta(uuid, text) from public, anon;
grant  execute on function public.anular_venta(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Ventas por día en hora de Venezuela.
-- security_invoker = true respeta el RLS del usuario que consulta.
-- ---------------------------------------------------------------------------
create or replace view public.ventas_por_dia
with (security_invoker = true)
as
select (created_at at time zone 'America/Caracas')::date as dia,
       count(*)                                          as facturas,
       coalesce(sum(subtotal), 0)                        as base_imponible,
       coalesce(sum(monto_exento), 0)                    as exento,
       coalesce(sum(monto_iva), 0)                       as iva,
       coalesce(sum(total), 0)                           as total
  from public.ventas
 where estado = 'completada'
 group by 1;

comment on view public.ventas_por_dia is
  'Totales diarios (hora de Venezuela) de las ventas completadas. Excluye las anuladas.';

-- ---------------------------------------------------------------------------
-- Top 5 productos más vendidos en un rango de fechas.
-- ---------------------------------------------------------------------------
create or replace function public.top_productos(
  p_desde date,
  p_hasta date
)
returns table (
  producto_id uuid,
  nombre      text,
  unidades    bigint,
  monto       numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select d.producto_id,
         max(d.nombre_producto)::text as nombre,
         sum(d.cantidad)::bigint      as unidades,
         sum(d.subtotal)              as monto
    from public.detalle_ventas d
    join public.ventas v on v.id = d.venta_id
   where v.estado = 'completada'
     and (v.created_at at time zone 'America/Caracas')::date between p_desde and p_hasta
   group by d.producto_id
   order by 3 desc
   limit 5;
$$;

comment on function public.top_productos(date, date) is
  'Top 5 de productos por unidades vendidas en un rango de fechas (hora de Venezuela).';

revoke execute on function public.top_productos(date, date) from public, anon;
grant  execute on function public.top_productos(date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Resumen del período (base imponible, exento, IVA y total), sin anuladas.
-- ---------------------------------------------------------------------------
create or replace function public.resumen_periodo(
  p_desde date,
  p_hasta date
)
returns table (
  facturas       bigint,
  base_imponible numeric,
  exento         numeric,
  iva            numeric,
  total          numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)                    as facturas,
         coalesce(sum(subtotal), 0)  as base_imponible,
         coalesce(sum(monto_exento), 0) as exento,
         coalesce(sum(monto_iva), 0) as iva,
         coalesce(sum(total), 0)     as total
    from public.ventas
   where estado = 'completada'
     and (created_at at time zone 'America/Caracas')::date between p_desde and p_hasta;
$$;

revoke execute on function public.resumen_periodo(date, date) from public, anon;
grant  execute on function public.resumen_periodo(date, date) to authenticated;


-- ############################################################################
-- ##  ARCHIVO: seed.sql
-- ############################################################################

-- ============================================================================
-- seed.sql — Datos de prueba realistas (FarmaImport, C.A.)
-- Ejecutar DESPUÉS de 001 → 004.
-- Es idempotente: se puede correr varias veces sin duplicar.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categorías (6)
-- ---------------------------------------------------------------------------
insert into public.categorias (nombre, descripcion) values
  ('Analgésicos y Antiinflamatorios', 'Dolor, fiebre e inflamación'),
  ('Antibióticos',                    'Tratamientos antibacterianos con récipe'),
  ('Vitaminas y Suplementos',         'Complementos nutricionales y defensas'),
  ('Cuidado Personal',                'Higiene, dermocosmética y protección solar'),
  ('Primeros Auxilios',               'Curaciones, vendajes y botiquín'),
  ('Bebés y Maternal',                'Pañales, fórmulas y cuidado del bebé')
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------------------
-- Productos (30) — incluye stock bajo (<= 5) y uno agotado (0)
-- ---------------------------------------------------------------------------
insert into public.productos (
  codigo, nombre, descripcion, laboratorio, presentacion,
  precio_unitario, stock, exento, categoria_id
)
select v.codigo, v.nombre, v.descripcion, v.laboratorio, v.presentacion,
       v.precio::numeric(12, 2), v.stock::integer, v.exento::boolean, c.id
from (values
  -- Analgésicos y Antiinflamatorios
  ('ANL-001', 'Acetaminofén 500 mg',        'Analgésico y antipirético de venta libre', 'Genven',   'Caja x 10 tabletas',      12.50, 120, true,  'Analgésicos y Antiinflamatorios'),
  ('ANL-002', 'Ibuprofeno 400 mg',          'Antiinflamatorio no esteroideo',           'Genven',   'Caja x 10 tabletas',      18.90,  85, false, 'Analgésicos y Antiinflamatorios'),
  ('ANL-003', 'Diclofenac 50 mg',           'Antiinflamatorio para dolor muscular',     'Meyer',    'Caja x 20 tabletas',      24.00,  60, false, 'Analgésicos y Antiinflamatorios'),
  ('ANL-004', 'Aspirina 100 mg',            'Antiagregante plaquetario',                'Bayer',    'Caja x 30 tabletas',      15.00,   4, true,  'Analgésicos y Antiinflamatorios'),
  ('ANL-005', 'Ketoprofeno gel 2.5%',       'Gel antiinflamatorio de uso tópico',       'Tubes',    'Tubo x 60 g',             42.00,  22, false, 'Analgésicos y Antiinflamatorios'),
  ('ANL-006', 'Naproxeno 500 mg',           'Analgésico de larga duración',             'Genven',   'Caja x 10 tabletas',      21.50,   0, false, 'Analgésicos y Antiinflamatorios'),

  -- Antibióticos
  ('ANT-001', 'Amoxicilina 500 mg',         'Antibiótico de amplio espectro',           'Genven',   'Cápsulas x 12',           38.00,  45, false, 'Antibióticos'),
  ('ANT-002', 'Azitromicina 500 mg',        'Antibiótico macrólido de 3 días',          'Roemmers', 'Caja x 3 tabletas',       65.00,  30, false, 'Antibióticos'),
  ('ANT-003', 'Cefalexina 500 mg',          'Antibiótico cefalosporínico',              'Meyer',    'Cápsulas x 12',           52.00,  18, false, 'Antibióticos'),
  ('ANT-004', 'Metronidazol 500 mg',        'Antibiótico y antiparasitario',            'Genven',   'Caja x 10 tabletas',      19.50,   3, false, 'Antibióticos'),
  ('ANT-005', 'Amoxicilina + Ác. Clavulánico','Antibiótico de amplio espectro reforzado','Roemmers', 'Caja x 14 tabletas',      98.00,  12, false, 'Antibióticos'),

  -- Vitaminas y Suplementos
  ('VIT-001', 'Vitamina C 500 mg',          'Defensas y antioxidante',                  'Nature''s Garden', 'Frasco x 60 tabletas', 35.00, 70, false, 'Vitaminas y Suplementos'),
  ('VIT-002', 'Multivitamínico adulto',     'Complejo vitamínico diario',               'Centrum',  'Frasco x 30 tabletas',    89.00,  25, false, 'Vitaminas y Suplementos'),
  ('VIT-003', 'Vitamina D3 1000 UI',        'Salud ósea e inmunidad',                   'Nature''s Garden', 'Frasco x 60 cápsulas', 48.00,  5, false, 'Vitaminas y Suplementos'),
  ('VIT-004', 'Hierro + Ácido Fólico',      'Prevención de anemia',                     'Genven',   'Caja x 30 tabletas',      28.00,  40, false, 'Vitaminas y Suplementos'),
  ('VIT-005', 'Omega 3 1000 mg',            'Ácidos grasos esenciales',                 'Nature''s Garden', 'Frasco x 50 cápsulas', 76.00, 15, false, 'Vitaminas y Suplementos'),
  ('VIT-006', 'Zinc 50 mg',                 'Apoyo inmunológico',                       'Nature''s Garden', 'Frasco x 60 tabletas', 32.00,   8, false, 'Vitaminas y Suplementos'),

  -- Cuidado Personal
  ('CUI-001', 'Alcohol isopropílico 70%',   'Desinfectante de superficies',             'Farmatodo','Frasco x 500 ml',         14.00,  90, false, 'Cuidado Personal'),
  ('CUI-002', 'Jabón antibacterial',        'Limpieza profunda de manos',               'Protex',   'Barra x 110 g',            9.50, 150, false, 'Cuidado Personal'),
  ('CUI-003', 'Crema dental',               'Protección anticaries',                    'Colgate',  'Tubo x 100 ml',           22.00,  60, false, 'Cuidado Personal'),
  ('CUI-004', 'Protector solar FPS 50',     'Protección UVA/UVB',                       'Neutrogena','Frasco x 120 ml',        120.00,   2, false, 'Cuidado Personal'),
  ('CUI-005', 'Shampoo anticaspa',          'Control de caspa y sebo',                  'Head & Shoulders', 'Frasco x 375 ml', 68.00,  20, false, 'Cuidado Personal'),

  -- Primeros Auxilios
  ('PRI-001', 'Gasas estériles',            'Gasas de algodón estériles',               'BSN',      'Paquete x 10 unidades',   11.00, 100, false, 'Primeros Auxilios'),
  ('PRI-002', 'Vendas elásticas 10 cm',     'Vendaje de compresión',                    'BSN',      'Unidad',                   8.50,  75, false, 'Primeros Auxilios'),
  ('PRI-003', 'Curitas',                    'Apósitos adhesivos',                       'BSN',      'Caja x 30 unidades',       7.00,   4, false, 'Primeros Auxilios'),
  ('PRI-004', 'Suero fisiológico 0.9%',     'Solución salina estéril',                  'Fresenius', 'Frasco x 500 ml',        19.00,  35, true,  'Primeros Auxilios'),
  ('PRI-005', 'Termómetro digital',         'Medición de temperatura corporal',         'Omron',    'Unidad',                  95.00,  10, false, 'Primeros Auxilios'),

  -- Bebés y Maternal
  ('BEB-001', 'Pañales talla M',            'Pañales desechables',                      'Huggies',  'Paquete x 30 unidades',  145.00,  24, false, 'Bebés y Maternal'),
  ('BEB-002', 'Fórmula infantil 0-6 meses', 'Leche de fórmula etapa 1',                 'Similac',  'Lata x 400 g',           210.00,   9, false, 'Bebés y Maternal'),
  ('BEB-003', 'Crema antipañalitis',        'Protección contra la dermatitis',          'Desitin',  'Tubo x 100 g',            54.00,  16, false, 'Bebés y Maternal')
) as v(codigo, nombre, descripcion, laboratorio, presentacion, precio, stock, exento, categoria)
join public.categorias c on c.nombre = v.categoria
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------------
-- Clientes de ejemplo (3)
-- ---------------------------------------------------------------------------
insert into public.clientes (nombre, rif_cedula, direccion, telefono, email) values
  ('Juan Pérez',                'V-12345678',   'Av. Libertador, Caracas',            '0414-1234567', 'juan.perez@ejemplo.com'),
  ('Distribuidora XYZ, C.A.',   'J-40123456-7', 'Zona Industrial, Valencia, Carabobo', '0241-1234567', 'compras@xyz-ejemplo.com'),
  ('María Rodríguez',           'V-18765432',   'Urb. La Trinidad, Baruta, Miranda',   '0424-7654321', 'maria.rodriguez@ejemplo.com')
on conflict (rif_cedula) do nothing;

-- ---------------------------------------------------------------------------
-- Verificación rápida
-- ---------------------------------------------------------------------------
-- select count(*) as categorias from public.categorias;   -- 6
-- select count(*) as productos  from public.productos;    -- 30
-- select count(*) as stock_bajo from public.productos where stock <= 5; -- 6
