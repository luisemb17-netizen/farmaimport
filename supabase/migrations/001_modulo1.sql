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
