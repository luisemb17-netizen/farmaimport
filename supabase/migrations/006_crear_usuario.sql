-- ============================================================================
-- 006_crear_usuario.sql — Alta de usuarios desde el panel (solo administrador)
--
-- ¿Por qué una función SQL y no la Admin API de Supabase?
--   La Admin API exige la service_role key, que NUNCA debe estar en la app.
--   Con una función SECURITY DEFINER, el permiso se valida dentro de PostgreSQL
--   con es_admin() y la llave secreta no sale del servidor.
--
-- La función inserta en auth.users y auth.identities (lo que GoTrue necesita
-- para el login por correo) y el trigger crear_perfil() crea la fila en
-- public.perfiles automáticamente.
-- ============================================================================

create or replace function public.crear_usuario(
  p_email           text,
  p_password        text,
  p_nombre_completo text,
  p_cedula          text default null,
  p_rol             text default 'cajero'
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id     uuid;
  v_email  text;
  v_cedula text;
begin
  -- 1) Solo administradores
  if not public.es_admin() then
    raise exception 'Solo un administrador puede crear usuarios';
  end if;

  -- 2) Validaciones
  v_email := lower(trim(p_email));
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'El correo no es válido';
  end if;

  if length(coalesce(p_password, '')) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres';
  end if;

  if coalesce(trim(p_nombre_completo), '') = '' then
    raise exception 'El nombre completo es obligatorio';
  end if;

  if p_rol not in ('administrador', 'cajero') then
    raise exception 'Rol inválido';
  end if;

  if exists (select 1 from auth.users u where lower(u.email) = v_email) then
    raise exception 'Ya existe un usuario con el correo %', v_email;
  end if;

  v_cedula := nullif(trim(coalesce(p_cedula, '')), '');

  -- 3) Usuario de autenticación (ya confirmado: puede entrar de inmediato)
  v_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nombre_completo', p_nombre_completo, 'cedula', v_cedula),
    '', '', '', ''
  );

  -- 4) Identidad: sin esta fila el login por correo falla con error 500
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_email),
    'email', now(), now(), now()
  );

  -- 5) El trigger ya creó el perfil; aquí se fija el rol y los datos
  update public.perfiles
     set rol             = p_rol,
         nombre_completo = p_nombre_completo,
         email           = v_email,
         cedula          = coalesce(v_cedula, cedula),
         activo          = true
   where id = v_id;

  return v_id;
end;
$$;

comment on function public.crear_usuario(text, text, text, text, text) is
  'Crea un usuario (auth.users + auth.identities + perfiles). Solo administradores.';

-- Solo usuarios autenticados pueden llamarla; la validación real está dentro.
revoke execute on function public.crear_usuario(text, text, text, text, text) from public, anon;
grant  execute on function public.crear_usuario(text, text, text, text, text) to authenticated;
