// ============================================================================
// PDF de la factura en el SERVIDOR (para adjuntarlo a un correo).
// Devuelve el documento en base64, que es lo que espera la API de Resend.
//
// La importación es dinámica a propósito: si jsPDF fallara al cargar en el
// servidor, el error se captura en la Server Action y se devuelve un mensaje
// claro, sin tumbar la página.
// ============================================================================

import type { DatosFactura } from "@/lib/types/factura";

export async function generarPdfBase64(datos: DatosFactura): Promise<string> {
  const { construirPdf } = await import("@/lib/pdf/factura-doc");
  const doc = construirPdf(datos);
  const buffer = Buffer.from(doc.output("arraybuffer"));
  return buffer.toString("base64");
}
