"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Mail, X } from "lucide-react";
import { enviarFacturaPorCorreo } from "@/lib/actions/correo";

export function BotonEnviarFactura({
  ventaId,
  numeroFactura,
  emailInicial,
}: {
  ventaId: string;
  numeroFactura: string;
  emailInicial?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [correo, setCorreo] = useState(emailInicial ?? "");
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    const resultado = await enviarFacturaPorCorreo(ventaId, correo);
    setEnviando(false);

    if (!resultado.ok) {
      toast.error(resultado.mensaje);
      return;
    }

    toast.success(resultado.mensaje);
    setAbierto(false);
  }

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className="btn btn-suave">
        <Mail className="h-4 w-4" aria-hidden />
        Enviar por correo
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-negro/55 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-correo"
            className="w-full max-w-md rounded-[14px] border border-borde bg-superficie p-6 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.6)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="titulo-correo" className="text-[16px] font-bold tracking-tight">
                  Enviar {numeroFactura}
                </h2>
                <p className="mt-1 text-[12px] text-texto-2">
                  Se enviará el PDF de la factura al correo que indiques.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded p-1 text-texto-3 hover:text-texto"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="etiqueta mt-4" htmlFor="correo-destino">
              Correo del cliente
            </label>
            <input
              id="correo-destino"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="cliente@ejemplo.com"
              className="campo"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void enviar();
                }
              }}
            />

            <p className="mt-2 text-[11px] text-texto-3">
              Requiere la variable <span className="mono">RESEND_API_KEY</span> configurada en el
              servidor.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="btn btn-suave"
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void enviar()}
                className="btn btn-primario"
                disabled={enviando || correo.trim().length < 5}
              >
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Mail className="h-4 w-4" aria-hidden />
                )}
                Enviar factura
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
