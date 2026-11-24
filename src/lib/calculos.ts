// ============================================================================
// Cálculos de la venta — MISMA REGLA que la función SQL registrar_venta().
//
//   1. Cada línea se redondea a 2 decimales:  round(precio * cantidad, 2)
//   2. Las líneas exentas (E) no pagan IVA y se totalizan aparte.
//   3. El IVA se calcula sobre la base imponible y se redondea a 2 decimales.
//   4. Total = base imponible + exento + IVA.
//
// La pantalla es SOLO una vista previa: el monto que vale es el que guarda
// la base de datos. Nunca se envían precios ni totales desde el navegador.
// ============================================================================

/** Redondeo comercial a 2 decimales (evita 0.1 + 0.2 = 0.30000000000000004). */
export function redondear2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export interface LineaCalculable {
  precio_unitario: number;
  cantidad: number;
  exento: boolean;
}

export interface TotalesVenta {
  baseImponible: number;
  exento: number;
  iva: number;
  total: number;
}

/**
 * Calcula los totales de una venta.
 * @param lineas  líneas del carrito (o del detalle de una venta)
 * @param porcentajeIva  alícuota configurada (16.00 por defecto)
 */
export function calcularTotales(
  lineas: readonly LineaCalculable[],
  porcentajeIva: number,
): TotalesVenta {
  let gravado = 0;
  let exento = 0;

  for (const linea of lineas) {
    const monto = redondear2(linea.precio_unitario * linea.cantidad);
    if (linea.exento) exento += monto;
    else gravado += monto;
  }

  const baseImponible = redondear2(gravado);
  const totalExento = redondear2(exento);
  const iva = redondear2((baseImponible * porcentajeIva) / 100);

  return {
    baseImponible,
    exento: totalExento,
    iva,
    total: redondear2(baseImponible + totalExento + iva),
  };
}
