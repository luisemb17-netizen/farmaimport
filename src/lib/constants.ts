// ============================================================================
// Constantes compartidas del sistema
// ============================================================================

export const NOMBRE_APP = "FarmaImport";
export const DESCRIPCION_APP = "Sistema de Facturación Digital · Simulación SENIAT";

/** Un producto se considera con stock bajo en este umbral o menos. */
export const STOCK_BAJO = 5;

/** Productos por página en el listado (paginación del Módulo 2). */
export const PRODUCTOS_POR_PAGINA = 10;

/** Ventas por página en el historial. */
export const VENTAS_POR_PAGINA = 15;

export const ROLES = [
  { value: "administrador", label: "Administrador" },
  { value: "cajero", label: "Cajero" },
] as const;

export const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "pago_movil", label: "Pago Móvil" },
  { value: "punto_de_venta", label: "Punto de Venta" },
] as const;

export type MetodoPagoValor = (typeof METODOS_PAGO)[number]["value"];

export function etiquetaMetodoPago(valor: string): string {
  return METODOS_PAGO.find((m) => m.value === valor)?.label ?? valor;
}

/** Expresión regular oficial del RIF venezolano: J-12345678-9 */
export const REGEX_RIF = /^[VEJPG]-\d{8}-\d$/;

/** Cédula o RIF del cliente: V-12345678 o J-12345678-9 */
export const REGEX_RIF_CEDULA = /^[VEJPG]-\d{6,9}(-\d)?$/;

/** Leyenda obligatoria de la simulación académica. */
export const LEYENDA_SENIAT =
  "Documento generado con fines académicos — SIN VALIDEZ FISCAL. " +
  "Formato basado en las Providencias Administrativas SNAT/2011/00071 y " +
  "SNAT/2024/000102 del SENIAT.";

export const ZONA_HORARIA = "America/Caracas";
