import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText, Receipt } from "lucide-react";
import { obtenerSesion } from "@/lib/auth/sesion";
import { construirDatosFactura, obtenerVenta } from "@/lib/consultas/ventas";
import { formatoBs, formatoFechaHora } from "@/lib/formato";
import { Insignia } from "@/components/ui/Insignia";
import { BotonAnular } from "@/components/facturas/BotonAnular";
import { BotonEnviarFactura } from "@/components/facturas/BotonEnviarFactura";
import { BotonPdf } from "@/components/facturas/BotonPdf";
import { BotonImprimir } from "@/components/facturas/BotonImprimir";
import { PlantillaFactura } from "@/components/facturas/PlantillaFactura";
import type { ConfiguracionNegocio } from "@/lib/types/database";

export const metadata: Metadata = { title: "Factura" };

export default async function FacturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, perfil } = await obtenerSesion();
  const esAdmin = perfil?.rol === "administrador";

  const venta = await obtenerVenta(supabase, id);
  if (!venta) notFound();

  const { data: config } = await supabase
    .from("configuracion_negocio")
    .select("*")
    .limit(1)
    .maybeSingle();

  // Correo del cliente para precargar el envío de la factura.
  const { data: cliente } = await supabase
    .from("clientes")
    .select("email")
    .eq("id", venta.cliente_id)
    .maybeSingle();

  const emailCliente = (cliente as { email: string | null } | null)?.email ?? "";

  const datos = construirDatosFactura(venta, config as ConfiguracionNegocio | null);
  const anulada = venta.estado === "anulada";

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------- Barra de acciones (no se imprime) ---------------- */}
      <div className="no-imprimir flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/ventas"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-texto-3 hover:text-azul"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            Ventas
          </Link>
          <Insignia tono={anulada ? "peligro" : "ok"}>
            {anulada ? "Anulada" : "Completada"}
          </Insignia>
          <span className="text-[11.5px] text-texto-3">{formatoFechaHora(venta.created_at)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BotonEnviarFactura
            ventaId={venta.id}
            numeroFactura={venta.numero_factura}
            emailInicial={emailCliente}
          />
          <BotonImprimir />
          <BotonPdf datos={datos} />
          {esAdmin && !anulada && (
            <BotonAnular ventaId={venta.id} numeroFactura={venta.numero_factura} />
          )}
        </div>
      </div>

      {/* ---------------- Factura ---------------- */}
      <PlantillaFactura datos={datos} />

      {/* ---------------- Pie informativo (no se imprime) ---------------- */}
      <div className="no-imprimir flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-texto-3">
        <span>
          Total registrado en la base de datos:{" "}
          <b className="text-texto-2">{formatoBs(Number(venta.total))}</b>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/ventas/${venta.id}`}
            className="inline-flex items-center gap-1 font-semibold text-azul hover:underline"
          >
            <Receipt className="h-3.5 w-3.5" aria-hidden />
            Detalle de la venta
          </Link>
          <Link
            href="/dashboard/pos"
            className="inline-flex items-center gap-1 font-semibold text-azul hover:underline"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Nueva venta
          </Link>
        </div>
      </div>
    </div>
  );
}
