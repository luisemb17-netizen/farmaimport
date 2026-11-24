"use server";

import { obtenerSesion } from "@/lib/auth/sesion";
import { construirDatosFactura, obtenerVenta } from "@/lib/consultas/ventas";
import { generarPdfBase64 } from "@/lib/pdf/factura-servidor";
import { crearPlantillaCorreo } from "@/lib/correo/plantilla";
import type { ActionResult, ConfiguracionNegocio } from "@/lib/types/database";

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Envía la factura por correo con su PDF adjunto usando Resend (punto extra).
 *
 * La llave vive SOLO en el servidor (RESEND_API_KEY, sin NEXT_PUBLIC_).
 * Si no está configurada, se devuelve un mensaje claro en lugar de fallar.
 */
export async function enviarFacturaPorCorreo(
  ventaId: string,
  correo: string,
): Promise<ActionResult> {
  const { supabase } = await obtenerSesion();

  const destino = correo.trim().toLowerCase();
  if (!REGEX_CORREO.test(destino)) {
    return { ok: false, mensaje: "Escribe un correo electrónico válido." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const remitente = process.env.EMAIL_FROM ?? "FarmaImport <onboarding@resend.dev>";

  if (!apiKey) {
    return {
      ok: false,
      mensaje:
        "Falta configurar RESEND_API_KEY en las variables de entorno (Vercel → Settings → Environment Variables).",
    };
  }

  const venta = await obtenerVenta(supabase, ventaId);
  if (!venta) {
    return { ok: false, mensaje: "No se encontró la factura." };
  }

  const { data: config } = await supabase
    .from("configuracion_negocio")
    .select("*")
    .limit(1)
    .maybeSingle();

  const datos = construirDatosFactura(venta, config as ConfiguracionNegocio | null);

  let adjuntoBase64: string;
  try {
    adjuntoBase64 = await generarPdfBase64(datos);
  } catch {
    return { ok: false, mensaje: "No se pudo generar el PDF de la factura." };
  }

  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remitente,
        to: [destino],
        subject: `Factura ${datos.comprobante.numeroFactura} — ${datos.emisor.razonSocial}`,
        html: crearPlantillaCorreo(datos),
        attachments: [
          {
            filename: `${datos.comprobante.numeroFactura}.pdf`,
            content: adjuntoBase64,
          },
        ],
      }),
    });

    if (!respuesta.ok) {
      const detalle = (await respuesta.text()).slice(0, 200);
      return {
        ok: false,
        mensaje: `Resend rechazó el envío (${respuesta.status}). ${detalle}`,
      };
    }
  } catch {
    return { ok: false, mensaje: "No se pudo conectar con el servicio de correo." };
  }

  return { ok: true, mensaje: `Factura enviada a ${destino}.` };
}
