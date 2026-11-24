import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConfiguracionNegocio, VentaConDetalle } from "@/lib/types/database";
import type { DatosFactura } from "@/lib/types/factura";
import { formatoFecha, formatoFechaHora, formatoHora } from "@/lib/formato";

/**
 * La tabla ventas tiene DOS llaves foráneas hacia perfiles (vendedor_id y
 * anulada_por). PostgREST exige desambiguar con el nombre de la restricción,
 * si no responde "more than one relationship was found".
 */
export const SELECT_VENTA =
  "*, detalle_ventas(*, productos(codigo)), vendedor:perfiles!ventas_vendedor_id_fkey(nombre_completo)";

export async function obtenerVenta(
  supabase: SupabaseClient,
  id: string,
): Promise<VentaConDetalle | null> {
  const { data } = await supabase
    .from("ventas")
    .select(SELECT_VENTA)
    .eq("id", id)
    .maybeSingle();

  return (data as VentaConDetalle | null) ?? null;
}

/** Arma la estructura que consumen la plantilla HTML y el PDF. */
export function construirDatosFactura(
  venta: VentaConDetalle,
  config: ConfiguracionNegocio | null,
): DatosFactura {
  return {
    emisor: {
      razonSocial: config?.razon_social ?? "FarmaImport, C.A.",
      rif: config?.rif ?? "J-00000000-0",
      direccionFiscal: config?.direccion_fiscal ?? "Caracas, Venezuela",
      telefono: config?.telefono ?? null,
      logoUrl: config?.logo_url ?? null,
    },
    comprobante: {
      numeroFactura: venta.numero_factura,
      numeroControl: venta.numero_control,
      fecha: formatoFecha(venta.created_at),
      hora: formatoHora(venta.created_at),
      estado: venta.estado,
    },
    cliente: {
      nombre: venta.cliente_nombre,
      rif: venta.cliente_rif,
      direccion: venta.cliente_direccion,
    },
    items: (venta.detalle_ventas ?? []).map((d) => ({
      cantidad: d.cantidad,
      codigo: d.productos?.codigo ?? "—",
      descripcion: d.nombre_producto,
      precioUnitario: Number(d.precio_unitario),
      monto: Number(d.subtotal),
      exento: d.exento,
    })),
    totales: {
      baseImponible: Number(venta.subtotal),
      exento: Number(venta.monto_exento),
      porcentajeIva: Number(venta.porcentaje_iva),
      iva: Number(venta.monto_iva),
      total: Number(venta.total),
    },
    pago: {
      metodo: venta.metodo_pago,
      vendedor: venta.vendedor?.nombre_completo ?? "—",
      observaciones: venta.observaciones,
    },
    anulacion:
      venta.estado === "anulada" && venta.anulada_at
        ? {
            motivo: venta.motivo_anulacion ?? "—",
            fecha: formatoFechaHora(venta.anulada_at),
          }
        : null,
  };
}
