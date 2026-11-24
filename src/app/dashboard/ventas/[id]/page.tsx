import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText, User } from "lucide-react";
import { obtenerSesion } from "@/lib/auth/sesion";
import { construirDatosFactura, obtenerVenta } from "@/lib/consultas/ventas";
import { etiquetaMetodoPago } from "@/lib/constants";
import { formatoBs, formatoFechaHora, formatoNumero } from "@/lib/formato";
import { Insignia } from "@/components/ui/Insignia";
import { BotonAnular } from "@/components/facturas/BotonAnular";
import type { ConfiguracionNegocio } from "@/lib/types/database";

export const metadata: Metadata = { title: "Detalle de venta" };

export default async function DetalleVentaPage({
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

  const datos = construirDatosFactura(venta, config as ConfiguracionNegocio | null);
  const anulada = venta.estado === "anulada";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/dashboard/ventas"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-texto-3 hover:text-azul"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Volver a ventas
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/dashboard/ventas/${venta.id}/factura`} className="btn btn-primario">
            <FileText className="h-4 w-4" aria-hidden />
            Ver factura
          </Link>
          {esAdmin && !anulada && (
            <BotonAnular ventaId={venta.id} numeroFactura={venta.numero_factura} />
          )}
        </div>
      </div>

      {/* Cabecera */}
      <section className="tarjeta p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mono text-[20px] font-black tracking-tight">
                {venta.numero_factura}
              </h2>
              <Insignia tono={anulada ? "peligro" : "ok"}>
                {anulada ? "Anulada" : "Completada"}
              </Insignia>
            </div>
            <p className="mono mt-1 text-[12px] text-texto-3">
              Nro. de control: {venta.numero_control}
            </p>
            <p className="mt-1 text-[12px] text-texto-2">
              Emitida: {formatoFechaHora(venta.created_at)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-texto-3">
              Total a pagar
            </p>
            <p className="num text-[24px] font-black text-titulo">{formatoBs(Number(venta.total))}</p>
          </div>
        </div>

        {anulada && (
          <div className="mt-4 rounded-[9px] border border-peligro-borde bg-peligro-suave px-3.5 py-2.5 text-[11.5px] text-peligro">
            <b>Anulada</b> {datos.anulacion ? `el ${datos.anulacion.fecha}` : ""}. Motivo:{" "}
            {datos.anulacion?.motivo ?? venta.motivo_anulacion ?? "—"}
          </div>
        )}
      </section>

      {/* Cliente / pago */}
      <section className="grid gap-3.5 md:grid-cols-2">
        <article className="tarjeta p-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-texto-3">
            <User className="h-3.5 w-3.5" aria-hidden />
            Comprador
          </h3>
          <p className="text-[14px] font-bold text-titulo">{venta.cliente_nombre}</p>
          <p className="mono mt-0.5 text-[12px] text-texto-2">{venta.cliente_rif}</p>
          {venta.cliente_direccion && (
            <p className="mt-1 text-[12px] text-texto-2">{venta.cliente_direccion}</p>
          )}
        </article>

        <article className="tarjeta p-5">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-texto-3">
            Pago y emisión
          </h3>
          <dl className="grid gap-1.5 text-[12px]">
            <div className="flex justify-between gap-3">
              <dt className="text-texto-3">Método</dt>
              <dd className="font-semibold">{etiquetaMetodoPago(venta.metodo_pago)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-texto-3">Vendedor</dt>
              <dd className="font-semibold">{datos.pago.vendedor}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-texto-3">Alícuota</dt>
              <dd className="font-semibold">{formatoNumero(Number(venta.porcentaje_iva))}%</dd>
            </div>
            {venta.observaciones && (
              <div className="flex justify-between gap-3">
                <dt className="text-texto-3">Observaciones</dt>
                <dd className="text-right font-semibold">{venta.observaciones}</dd>
              </div>
            )}
          </dl>
        </article>
      </section>

      {/* Detalle */}
      <section className="tarjeta p-4">
        <h3 className="mb-3 text-[15px] font-bold tracking-tight">Productos vendidos</h3>

        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th className="text-right">Cantidad</th>
                <th className="text-right">P. Unitario</th>
                <th className="text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {datos.items.map((item, i) => (
                <tr key={`${item.codigo}-${i}`}>
                  <td className="mono">{item.codigo}</td>
                  <td>
                    {item.descripcion}
                    {item.exento && (
                      <span className="ml-1.5 rounded bg-azul-suave px-1.5 py-0.5 text-[10px] font-bold text-azul-oscuro">
                        (E)
                      </span>
                    )}
                  </td>
                  <td className="num text-right">{item.cantidad}</td>
                  <td className="num text-right">{formatoBs(item.precioUnitario)}</td>
                  <td className="num text-right font-semibold text-texto">
                    {formatoBs(item.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-4 w-full max-w-[320px] text-[12px]">
          <div className="flex justify-between py-1">
            <dt className="text-texto-2">Base imponible</dt>
            <dd className="num font-semibold">{formatoBs(datos.totales.baseImponible)}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-texto-2">Exento (E)</dt>
            <dd className="num font-semibold">{formatoBs(datos.totales.exento)}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-texto-2">IVA {datos.totales.porcentajeIva}%</dt>
            <dd className="num font-semibold">{formatoBs(datos.totales.iva)}</dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between border-t-2 border-azul pt-2">
            <dt className="text-[12px] font-black uppercase tracking-wide">Total</dt>
            <dd className="num text-[18px] font-black">{formatoBs(datos.totales.total)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
