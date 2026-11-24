import { formatoBs } from "@/lib/formato";
import type { DatosFactura } from "@/lib/types/factura";

/** Cuerpo HTML del correo que acompaña al PDF de la factura. */
export function crearPlantillaCorreo(datos: DatosFactura): string {
  const filas = datos.items
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e3e8f0;text-align:right;">${item.cantidad}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e3e8f0;font-family:monospace;font-size:12px;">${item.codigo}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e3e8f0;">${item.descripcion}${item.exento ? " (E)" : ""}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e3e8f0;text-align:right;">${formatoBs(item.precioUnitario)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e3e8f0;text-align:right;">${formatoBs(item.monto)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f5f7fb;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e3e8f0;border-radius:14px;overflow:hidden;">
      <div style="background:#0b1220;padding:22px 26px;color:#ffffff;">
        <p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#60a5fa;">
          ${datos.emisor.razonSocial}
        </p>
        <h1 style="margin:6px 0 0;font-size:20px;">Factura ${datos.comprobante.numeroFactura}</h1>
        <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">
          Nro. de control ${datos.comprobante.numeroControl} · ${datos.comprobante.fecha} ${datos.comprobante.hora}
        </p>
      </div>

      <div style="padding:22px 26px;">
        <p style="margin:0 0 14px;font-size:14px;">
          Hola <b>${datos.cliente.nombre}</b>, adjuntamos tu factura en PDF.
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f5f7fb;color:#64748b;font-size:10px;text-transform:uppercase;">
              <th style="padding:6px 8px;text-align:right;">Cant.</th>
              <th style="padding:6px 8px;text-align:left;">Código</th>
              <th style="padding:6px 8px;text-align:left;">Descripción</th>
              <th style="padding:6px 8px;text-align:right;">P. Unit.</th>
              <th style="padding:6px 8px;text-align:right;">Monto</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>

        <table style="width:100%;margin-top:14px;font-size:13px;">
          <tr>
            <td style="color:#475569;">Base imponible</td>
            <td style="text-align:right;">${formatoBs(datos.totales.baseImponible)}</td>
          </tr>
          <tr>
            <td style="color:#475569;">Exento (E)</td>
            <td style="text-align:right;">${formatoBs(datos.totales.exento)}</td>
          </tr>
          <tr>
            <td style="color:#475569;">IVA ${datos.totales.porcentajeIva}%</td>
            <td style="text-align:right;">${formatoBs(datos.totales.iva)}</td>
          </tr>
          <tr>
            <td style="padding-top:8px;border-top:2px solid #2563eb;font-weight:700;">TOTAL A PAGAR</td>
            <td style="padding-top:8px;border-top:2px solid #2563eb;text-align:right;font-weight:700;font-size:16px;">
              ${formatoBs(datos.totales.total)}
            </td>
          </tr>
        </table>

        <p style="margin:18px 0 0;font-size:12px;color:#475569;">
          Método de pago: <b>${datos.pago.metodo.replaceAll("_", " ")}</b> · Vendedor: <b>${datos.pago.vendedor}</b>
        </p>
      </div>

      <div style="padding:14px 26px 20px;border-top:1px solid #e3e8f0;background:#fafbfd;">
        <p style="margin:0;font-size:9px;color:#94a3b8;line-height:1.5;text-align:center;">
          Documento generado con fines académicos — SIN VALIDEZ FISCAL. Formato basado en las
          Providencias Administrativas SNAT/2011/00071 y SNAT/2024/000102 del SENIAT.
        </p>
      </div>
    </div>
  </body>
</html>`;
}
