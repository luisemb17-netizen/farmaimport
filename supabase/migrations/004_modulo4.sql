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
