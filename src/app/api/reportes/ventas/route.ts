import { createClient } from "@/lib/supabase/server";
import { formatoFecha, formatoHora, formatoNumero, sumarDias } from "@/lib/formato";

/**
 * Exporta el reporte de ventas a CSV (punto extra).
 * Respeta el RLS: un cajero solo exporta sus propias ventas.
 *
 * GET /api/reportes/ventas?desde=2026-11-01&hasta=2026-11-30&estado=completada
 */

/** Venezuela es UTC−4 todo el año: medianoche local = 04:00 UTC. */
function inicioDiaUTC(fecha: string): string {
  return `${fecha}T04:00:00.000Z`;
}

function celda(valor: string | number | null | undefined): string {
  const texto = String(valor ?? "");
  return /[";\n\r]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

interface FilaVenta {
  numero_factura: string;
  numero_control: string;
  created_at: string;
  cliente_nombre: string;
  cliente_rif: string;
  metodo_pago: string;
  subtotal: number;
  monto_exento: number;
  monto_iva: number;
  total: number;
  estado: string;
  vendedor: { nombre_completo: string } | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";
  const estado = searchParams.get("estado") ?? "";
  const vendedor = searchParams.get("vendedor") ?? "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autenticado", { status: 401 });
  }

  let consulta = supabase
    .from("ventas")
    .select(
      "numero_factura, numero_control, created_at, cliente_nombre, cliente_rif, metodo_pago, subtotal, monto_exento, monto_iva, total, estado, vendedor:perfiles!ventas_vendedor_id_fkey(nombre_completo)",
    )
    .order("created_at", { ascending: true });

  if (desde) consulta = consulta.gte("created_at", inicioDiaUTC(desde));
  if (hasta) consulta = consulta.lt("created_at", inicioDiaUTC(sumarDias(hasta, 1)));
  if (estado === "completada" || estado === "anulada") consulta = consulta.eq("estado", estado);
  if (vendedor) consulta = consulta.eq("vendedor_id", vendedor);

  const { data, error } = await consulta;

  if (error) {
    return new Response(`Error al consultar las ventas: ${error.message}`, { status: 500 });
  }

  const filas = (data ?? []) as unknown as FilaVenta[];

  const cabecera = [
    "Factura",
    "Nro. Control",
    "Fecha",
    "Hora",
    "Cliente",
    "RIF/Cédula",
    "Vendedor",
    "Método de pago",
    "Base imponible",
    "Exento (E)",
    "IVA",
    "Total",
    "Estado",
  ];

  const cuerpo = filas.map((v) => [
    v.numero_factura,
    v.numero_control,
    formatoFecha(v.created_at),
    formatoHora(v.created_at),
    v.cliente_nombre,
    v.cliente_rif,
    v.vendedor?.nombre_completo ?? "—",
    v.metodo_pago.replaceAll("_", " "),
    formatoNumero(Number(v.subtotal)),
    formatoNumero(Number(v.monto_exento)),
    formatoNumero(Number(v.monto_iva)),
    formatoNumero(Number(v.total)),
    v.estado,
  ]);

  // BOM para que Excel respete los acentos; separador ";" (Excel en español).
  const csv =
    "\uFEFF" +
    [cabecera, ...cuerpo].map((fila) => fila.map(celda).join(";")).join("\r\n") +
    "\r\n";

  const nombreArchivo = `ventas_${desde || "inicio"}_${hasta || "hoy"}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
