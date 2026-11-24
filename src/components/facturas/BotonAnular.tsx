"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Ban, Loader2, X } from "lucide-react";
import { anularVenta } from "@/lib/actions/ventas";

export function BotonAnular({
  ventaId,
  numeroFactura,
}: {
  ventaId: string;
  numeroFactura: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setEnviando(true);

    const resultado = await anularVenta(ventaId, motivo);

    setEnviando(false);

    if (!resultado.ok) {
      toast.error(resultado.mensaje);
      return;
    }

    toast.success(resultado.mensaje);
    setAbierto(false);
    setMotivo("");
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className="btn btn-peligro">
        <Ban className="h-4 w-4" aria-hidden />
        Anular factura
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-negro/55 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-anular"
            className="w-full max-w-md rounded-[14px] border border-borde bg-superficie p-6 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.6)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="titulo-anular" className="text-[16px] font-bold tracking-tight">
                  Anular {numeroFactura}
                </h2>
                <p className="mt-1 text-[12px] text-texto-2">
                  La factura no se borra: pasa a estado «anulada», se devuelve el stock y
                  deja de contar en los reportes.
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

            <label className="etiqueta mt-4" htmlFor="motivo">
              Motivo de la anulación
            </label>
            <textarea
              id="motivo"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: el cliente devolvió la mercancía / error en el cobro"
              className="campo resize-none"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-texto-3">Mínimo 8 caracteres.</p>

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
                onClick={() => void confirmar()}
                className="btn btn-peligro"
                disabled={enviando || motivo.trim().length < 8}
              >
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Ban className="h-4 w-4" aria-hidden />
                )}
                Confirmar anulación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
