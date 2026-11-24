// ============================================================================
// Construcción del PDF de la factura (compartido por navegador y servidor).
//
// Solo dibuja el documento: no guarda ni descarga nada. Así el mismo código
// sirve para el botón "Descargar PDF" y para adjuntarlo en un correo.
//
// jsPDF funciona tanto en el navegador como en Node (probado con Node 24).
// ============================================================================

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { LEYENDA_SENIAT } from "@/lib/constants";
import { formatoBs, formatoNumero } from "@/lib/formato";
import type { DatosFactura } from "@/lib/types/factura";

export function construirPdf(datos: DatosFactura): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });

  const margen = 15;
  const ancho = 210;
  let y = 18;

  // ---------------- Emisor ----------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(datos.emisor.razonSocial, margen, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`RIF: ${datos.emisor.rif}`, margen, y);
  y += 4.5;

  const direccion = doc.splitTextToSize(datos.emisor.direccionFiscal, 105);
  doc.text(direccion, margen, y);
  y += direccion.length * 4.2;

  if (datos.emisor.telefono) {
    doc.text(`Teléfono: ${datos.emisor.telefono}`, margen, y);
  }

  // ---------------- Recuadro FACTURA ----------------
  const cajaX = 128;
  const cajaAncho = 67;

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.6);
  doc.roundedRect(cajaX, 14, cajaAncho, 30, 2, 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(37, 99, 235);
  doc.text("FACTURA", cajaX + cajaAncho / 2, 22, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Nro. Factura: ${datos.comprobante.numeroFactura}`, cajaX + 4, 29);
  doc.text(`Nro. Control: ${datos.comprobante.numeroControl}`, cajaX + 4, 34);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`${datos.comprobante.fecha}  ·  ${datos.comprobante.hora}`, cajaX + 4, 39.5);

  // ---------------- Separador ----------------
  y = Math.max(y, 48);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margen, y, ancho - margen, y);
  y += 7;

  // ---------------- Cliente ----------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("DATOS DEL CLIENTE", margen, y);
  y += 5;

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(datos.cliente.nombre, margen, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Cédula/RIF: ${datos.cliente.rif}`, margen, y + 4.5);

  if (datos.cliente.direccion) {
    const dirCliente = doc.splitTextToSize(`Dirección: ${datos.cliente.direccion}`, 170);
    doc.text(dirCliente, margen, y + 9);
    y += dirCliente.length * 4.2;
  }
  y += 12;

  // ---------------- Detalle ----------------
  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    head: [["CANT.", "CÓDIGO", "DESCRIPCIÓN", "P. UNIT.", "MONTO"]],
    body: datos.items.map((item) => [
      String(item.cantidad),
      item.codigo,
      item.exento ? `${item.descripcion} (E)` : item.descripcion,
      formatoNumero(item.precioUnitario),
      formatoNumero(item.monto),
    ]),
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: [245, 247, 251],
      textColor: [100, 116, 139],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    columnStyles: {
      0: { halign: "right", cellWidth: 14 },
      1: { cellWidth: 26, font: "courier" },
      2: { cellWidth: 80 },
      3: { halign: "right", cellWidth: 28 },
      4: { halign: "right", cellWidth: 32, fontStyle: "bold" },
    },
  });

  const ultimaY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY;
  y = (ultimaY ?? y) + 8;

  // ---------------- Totales ----------------
  const filasTotales: Array<[string, string, boolean]> = [
    ["Base imponible", formatoBs(datos.totales.baseImponible), false],
    ["Exento (E)", formatoBs(datos.totales.exento), false],
    [`IVA ${datos.totales.porcentajeIva}%`, formatoBs(datos.totales.iva), false],
    ["TOTAL A PAGAR", formatoBs(datos.totales.total), true],
  ];

  const xEtiqueta = 112;
  const xValor = 195;

  for (const [etiqueta, valor, destacado] of filasTotales) {
    if (destacado) {
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.4);
      doc.line(xEtiqueta, y - 4.5, xValor, y - 4.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
    }

    doc.text(etiqueta, xEtiqueta, y);
    doc.text(valor, xValor, y, { align: "right" });
    y += destacado ? 6.5 : 5;
  }

  y += 4;

  // ---------------- Pago ----------------
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margen, y, ancho - margen, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Método de pago: ${datos.pago.metodo}`, margen, y);
  doc.text(`Vendedor: ${datos.pago.vendedor}`, margen + 85, y);
  y += 5;

  if (datos.pago.observaciones) {
    const obs = doc.splitTextToSize(`Observaciones: ${datos.pago.observaciones}`, 170);
    doc.text(obs, margen, y);
    y += obs.length * 4;
  }

  // ---------------- Anulación ----------------
  if (datos.comprobante.estado === "anulada" && datos.anulacion) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(8.5);
    doc.text(
      `FACTURA ANULADA el ${datos.anulacion.fecha} — Motivo: ${datos.anulacion.motivo}`,
      margen,
      y,
    );
    doc.setTextColor(71, 85, 105);
  }

  // ---------------- Leyenda obligatoria ----------------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  const leyenda = doc.splitTextToSize(LEYENDA_SENIAT, 180);
  doc.text(leyenda, margen, 282);

  // ---------------- Marca de agua ANULADA ----------------
  if (datos.comprobante.estado === "anulada") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(58);
    doc.setTextColor(220, 38, 38);
    doc.text("ANULADA", 105, 175, { align: "center", angle: 32 });
  }

  return doc;
}
