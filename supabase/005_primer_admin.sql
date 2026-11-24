-- ============================================================================
-- 005_primer_admin.sql — Convertir la cuenta del equipo en administrador
--
-- ANTES DE EJECUTAR: cambia la línea marcada más abajo y pon el correo con el
-- que creaste la cuenta (el tuyo real). Ejemplo:
--     where email = 'juan.perez@gmail.com';
--
-- ORDEN:
--   1. Crea la cuenta (desde /registro en la app, o desde
--      Authentication → Users → Add user en Supabase).
--   2. Cambia el correo de abajo.
--   3. Ejecuta este archivo en el SQL Editor de Supabase.
--
-- Nota: el UPDATE funciona desde el SQL Editor porque auth.uid() es NULL y el
-- trigger proteger_rol() no bloquea el cambio. Desde la app, un cajero no
-- podría ascenderse a sí mismo.
-- ============================================================================

-- ▼▼▼ CAMBIA ESTE CORREO ▼▼▼
update public.perfiles
   set rol = 'administrador'
 where email = 'TU-CORREO@ejemplo.com';

-- Si el perfil se creó desde el panel de Supabase, no tendrá nombre.
-- Descomenta y ajusta para ponerle el nombre del equipo:
-- update public.perfiles
--    set nombre_completo = 'El Mejor Equipo'
--  where email = 'TU-CORREO@ejemplo.com';

-- Verificación: debe mostrar rol = administrador y activo = true
select id, nombre_completo, email, cedula, rol, activo
  from public.perfiles
 order by created_at;
