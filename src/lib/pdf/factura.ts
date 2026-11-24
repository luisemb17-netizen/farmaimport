// ============================================================================
// PDF de la factura en el NAVEGADOR.
//
// Se importa dinámicamente desde el botón (`await import(...)`) para que jsPDF
// nunca se evalúe en el servidor y no aparezca "window is not defined".
// ============================================================================

import type { DatosFactura } from "@/lib/types/factura";

export async function generarPdfFactura(datos: DatosFactura): Promise<void> {
  const { construirPdf } = await import("@/lib/pdf/factura-doc");
  const doc = construirPdf(datos);
  doc.save(`${datos.comprobante.numeroFactura}.pdf`);
}
