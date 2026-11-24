import type { CSSProperties } from "react";
import { LEYENDA_SENIAT } from "@/lib/constants";
import { formatoBs, formatoNumero } from "@/lib/formato";
import type { DatosFactura } from "@/lib/types/factura";

/**
 * La factura es un documento: debe verse igual en tema claro y oscuro.
 * Estas variables fuerzan la paleta clara dentro de la hoja.
 */
const VARS_DOCUMENTO = {
  "--color-blanco": "#ffffff",
  "--color-fondo": "#f5f7fb",
  "--color-fondo-2": "#eef2f8",
  "--color-superficie": "#ffffff",
  "--color-borde": "#e3e8f0",
  "--color-borde-fuerte": "#cbd5e1",
  "--color-texto": "#0f172a",
  "--color-texto-2": "#475569",
  "--color-texto-3": "#94a3b8",
  "--color-titulo": "#0f172a",
  "--color-negro": "#0b1220",
  "--color-azul": "#2563eb",
  "--color-azul-oscuro": "#1d4ed8",
  "--color-azul-suave": "#eff6ff",
  "--color-azul-borde": "#bfdbfe",
  "--color-peligro": "#dc2626",
  "--color-peligro-suave": "#fef2f2",
  "--color-peligro-borde": "#fecaca",
} as CSSProperties;

/**
 * Plantilla de factura con el formato exigido por la simulación SENIAT:
 * emisor, números de factura y control, fecha/hora, comprador, detalle,
 * base imponible, exento (E), alícuota, IVA y total en Bs.
 */
export function PlantillaFactura({ datos }: { datos: DatosFactura }) {
  const anulada = datos.comprobante.estado === "anulada";

  return (
    <article
      style={VARS_DOCUMENTO}
      className="hoja-factura relative mx-auto w-full max-w-[820px] overflow-hidden rounded-[14px] border border-borde bg-white p-8 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]"
    >
      {/* Marca de agua */}
      {anulada && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 grid place-items-center"
        >
          <span className="-rotate-[28deg] text-[86px] font-black tracking-widest text-peligro/15">
            ANULADA
          </span>
        </div>
      )}

      <div className="relative z-10">
        {/* ---------------- Emisor + comprobante ---------------- */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-borde pb-5">
          <div className="min-w-0">
            <h2 className="text-[17px] font-black tracking-tight text-negro">
              {datos.emisor.razonSocial}
            </h2>
            <p className="mt-1 text-[12px] font-semibold text-texto-2">
              RIF: {datos.emisor.rif}
            </p>
            <p className="mt-0.5 max-w-[340px] text-[11.5px] leading-snug text-texto-2">
              {datos.emisor.direccionFiscal}
            </p>
            {datos.emisor.telefono && (
              <p className="mt-0.5 text-[11.5px] text-texto-2">
                Teléfono: {datos.emisor.telefono}
              </p>
            )}
          </div>

          <div className="w-[220px] shrink-0 rounded-[10px] border-2 border-azul px-4 py-3">
            <p className="text-center text-[15px] font-black tracking-[0.18em] text-azul">
              FACTURA
            </p>
            <div className="mt-2 flex justify-between text-[11.5px]">
              <span className="text-texto-3">Nro. Factura</span>
              <span className="mono font-bold text-negro">{datos.comprobante.numeroFactura}</span>
            </div>
            <div className="mt-1 flex justify-between text-[11.5px]">
              <span className="text-texto-3">Nro. Control</span>
              <span className="mono font-bold text-negro">{datos.comprobante.numeroControl}</span>
            </div>
          </div>
        </header>

        {/* ---------------- Fecha y hora ---------------- */}
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-[11.5px]">
          <p>
            <span className="font-bold uppercase tracking-wide text-texto-3">Emisión: </span>
            <span className="font-semibold text-negro">{datos.comprobante.fecha}</span>
          </p>
          <p>
            <span className="font-bold uppercase tracking-wide text-texto-3">Hora: </span>
            <span className="font-semibold text-negro">{datos.comprobante.hora}</span>
          </p>
        </div>

        {/* ---------------- Cliente ---------------- */}
        <section className="mt-5 rounded-[10px] bg-fondo px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-texto-3">
            Datos del cliente
          </p>
          <div className="mt-1.5 grid gap-1 text-[12px] sm:grid-cols-2">
            <p>
              <span className="text-texto-3">Nombre/Razón Social: </span>
              <span className="font-semibold text-negro">{datos.cliente.nombre}</span>
            </p>
            <p>
              <span className="text-texto-3">Cédula/RIF: </span>
              <span className="font-semibold text-negro">{datos.cliente.rif}</span>
            </p>
            {datos.cliente.direccion && (
              <p className="sm:col-span-2">
                <span className="text-texto-3">Dirección: </span>
                <span className="text-negro">{datos.cliente.direccion}</span>
              </p>
            )}
          </div>
        </section>

        {/* ---------------- Detalle ---------------- */}
        <div className="mt-5 overflow-hidden rounded-[10px] border border-borde">
          <table className="w-full border-collapse text-[11.5px]">
            <thead>
              <tr className="bg-fondo text-[9.5px] uppercase tracking-[0.07em] text-texto-3">
                <th className="px-3 py-2 text-right font-bold">Cant.</th>
                <th className="px-3 py-2 text-left font-bold">Código</th>
                <th className="px-3 py-2 text-left font-bold">Descripción</th>
                <th className="px-3 py-2 text-right font-bold">P. Unit.</th>
                <th className="px-3 py-2 text-right font-bold">Monto</th>
              </tr>
            </thead>
            <tbody>
              {datos.items.map((item, i) => (
                <tr key={`${item.codigo}-${i}`} className="border-t border-borde">
                  <td className="num px-3 py-2 text-right">{item.cantidad}</td>
                  <td className="mono px-3 py-2 text-[11px]">{item.codigo}</td>
                  <td className="px-3 py-2">
                    {item.descripcion}
                    {item.exento && (
                      <span className="ml-1.5 rounded bg-azul-suave px-1 py-0.5 text-[9px] font-bold text-azul-oscuro">
                        (E)
                      </span>
                    )}
                  </td>
                  <td className="num px-3 py-2 text-right">{formatoNumero(item.precioUnitario)}</td>
                  <td className="num px-3 py-2 text-right font-semibold">{formatoNumero(item.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---------------- Totales ---------------- */}
        <div className="mt-4 flex justify-end">
          <dl className="w-full max-w-[320px] text-[12px]">
            <div className="flex justify-between py-1">
              <dt className="text-texto-2">Base imponible</dt>
              <dd className="num font-semibold text-negro">{formatoBs(datos.totales.baseImponible)}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-texto-2">Exento (E)</dt>
              <dd className="num font-semibold text-negro">{formatoBs(datos.totales.exento)}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-texto-2">IVA {datos.totales.porcentajeIva}%</dt>
              <dd className="num font-semibold text-negro">{formatoBs(datos.totales.iva)}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t-2 border-azul pt-2">
              <dt className="text-[12px] font-black uppercase tracking-wide text-negro">
                Total a pagar
              </dt>
              <dd className="num text-[18px] font-black text-negro">
                {formatoBs(datos.totales.total)}
              </dd>
            </div>
          </dl>
        </div>

        {/* ---------------- Pago ---------------- */}
        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-1 border-t border-borde pt-4 text-[11.5px]">
          <p>
            <span className="font-bold uppercase tracking-wide text-texto-3">Método de pago: </span>
            <span className="font-semibold capitalize text-negro">
              {datos.pago.metodo.replaceAll("_", " ")}
            </span>
          </p>
          <p>
            <span className="font-bold uppercase tracking-wide text-texto-3">Vendedor: </span>
            <span className="font-semibold text-negro">{datos.pago.vendedor}</span>
          </p>
          {datos.pago.observaciones && (
            <p className="w-full">
              <span className="font-bold uppercase tracking-wide text-texto-3">Observaciones: </span>
              <span className="text-negro">{datos.pago.observaciones}</span>
            </p>
          )}
        </div>

        {/* ---------------- Anulación ---------------- */}
        {anulada && datos.anulacion && (
          <div className="mt-4 rounded-[9px] border border-peligro-borde bg-peligro-suave px-3.5 py-2.5 text-[11.5px] text-[#b91c1c]">
            <b>Factura anulada</b> el {datos.anulacion.fecha}. Motivo: {datos.anulacion.motivo}
          </div>
        )}

        {/* ---------------- Leyenda ---------------- */}
        <footer className="mt-6 border-t border-borde pt-3">
          <p className="text-center text-[9px] leading-relaxed text-texto-3">
            {LEYENDA_SENIAT}
          </p>
          <p className="mt-1 text-center text-[8.5px] font-bold uppercase tracking-[0.18em] text-texto-3">
            Simulación
          </p>
        </footer>
      </div>
    </article>
  );
}
