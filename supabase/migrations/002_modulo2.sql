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
