// ============================================================================
// Formato de moneda, fechas y números — SIEMPRE en hora de Venezuela.
// Vercel corre en UTC; sin timeZone las fechas salen corridas 4 horas.
// ============================================================================

import { ZONA_HORARIA } from "@/lib/constants";

const nfMoneda = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Bs. 1.234,56 */
export function formatoBs(valor: number | string | null | undefined): string {
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (n === null || n === undefined || Number.isNaN(n)) return "Bs. 0,00";
  return `Bs. ${nfMoneda.format(n)}`;
}

/** 1.234,56 (sin el prefijo Bs.) */
export function formatoNumero(valor: number | string | null | undefined): string {
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (n === null || n === undefined || Number.isNaN(n)) return "0,00";
  return nfMoneda.format(n);
}

const nfEntero = new Intl.NumberFormat("es-VE", { maximumFractionDigits: 0 });

export function formatoEntero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "0";
  return nfEntero.format(valor);
}

const fFecha = new Intl.DateTimeFormat("es-VE", {
  timeZone: ZONA_HORARIA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const fHora = new Intl.DateTimeFormat("es-VE", {
  timeZone: ZONA_HORARIA,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

/** 10/11/2026 */
export function formatoFecha(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return fFecha.format(d);
}

/** 04:48 p. m. */
export function formatoHora(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return fHora.format(d);
}

/** 10/11/2026 · 04:48 p. m. */
export function formatoFechaHora(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  return `${formatoFecha(iso)} · ${formatoHora(iso)}`;
}

/** Fecha de hoy en Venezuela con formato YYYY-MM-DD (para <input type="date">). */
export function hoyCaracas(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return partes; // en-CA devuelve YYYY-MM-DD
}

/** Suma (o resta) días a una fecha YYYY-MM-DD sin desfase de zona horaria. */
export function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

/** Primer día del mes en curso (Venezuela). */
export function inicioDeMesCaracas(): string {
  return `${hoyCaracas().slice(0, 8)}01`;
}

/** Texto legible del estado de una venta. */
export function etiquetaEstado(estado: string): string {
  if (estado === "anulada") return "Anulada";
  if (estado === "completada") return "Completada";
  return estado;
}

/** Iniciales para el avatar del usuario. */
export function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return "?";
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}
