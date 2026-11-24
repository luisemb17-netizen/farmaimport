"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Download, Loader2 } from "lucide-react";
import type { DatosFactura } from "@/lib/types/factura";

export function BotonPdf({ datos }: { datos: DatosFactura }) {
  const [cargando, setCargando] = useState(false);

  async function descargar() {
    setCargando(true);
    try {
      // Importación dinámica: jsPDF usa `window`, así que solo se carga en el
      // navegador y nunca durante el renderizado en el servidor.
      const { generarPdfFactura } = await import("@/lib/pdf/factura");
      await generarPdfFactura(datos);
      toast.success("PDF generado.");
    } catch {
      toast.error("No se pudo generar el PDF. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <button type="button" onClick={() => void descargar()} disabled={cargando} className="btn btn-primario">
      {cargando ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      {cargando ? "Generando…" : "Descargar PDF"}
    </button>
  );
}
