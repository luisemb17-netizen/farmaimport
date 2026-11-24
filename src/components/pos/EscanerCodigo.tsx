"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CameraOff, Loader2, ScanLine, X } from "lucide-react";
import type { IScannerControls } from "@zxing/browser";

/**
 * Escáner de códigos de barras / QR con la cámara (punto extra).
 *
 * - `@zxing/browser` se importa dinámicamente: solo se descarga al abrir el
 *   escáner y nunca durante el renderizado en el servidor.
 * - La cámara exige HTTPS (Vercel lo tiene) o localhost.
 */
export function EscanerCodigo({
  onDetectar,
}: {
  onDetectar: (codigo: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  // Se guarda el callback en un ref para que la cámara NO se reinicie en cada
  // render (el padre pasa una función nueva cada vez).
  const onDetectarRef = useRef(onDetectar);
  useEffect(() => {
    onDetectarRef.current = onDetectar;
  }, [onDetectar]);

  useEffect(() => {
    if (!abierto) return;

    let cancelado = false;

    async function iniciar() {
      setIniciando(true);
      setError(null);

      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");

        if (cancelado || !videoRef.current) return;

        const lector = new BrowserMultiFormatReader();
        const controls = await lector.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (resultado, _err, controles) => {
            if (!resultado || cancelado) return;

            const codigo = resultado.getText();
            controles?.stop();
            controlsRef.current = null;
            setAbierto(false);
            onDetectarRef.current(codigo);
          },
        );

        if (cancelado) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
      } catch {
        setError(
          "No se pudo abrir la cámara. Revisa los permisos del navegador y que estés en HTTPS o localhost.",
        );
        toast.error("Sin acceso a la cámara.");
      } finally {
        setIniciando(false);
      }
    }

    void iniciar();

    return () => {
      cancelado = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [abierto]);

  function cerrar() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setAbierto(false);
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="Escanear código de barras"
        aria-label="Escanear código de barras con la cámara"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] border border-borde text-texto-2 transition hover:border-borde-fuerte hover:text-azul"
      >
        <ScanLine className="h-[18px] w-[18px]" aria-hidden />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-negro/70 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Escáner de código de barras"
            className="w-full max-w-md rounded-[14px] border border-borde bg-superficie p-5 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.6)]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-bold tracking-tight">Escanear código</h2>
                <p className="mt-0.5 text-[11.5px] text-texto-3">
                  Apunta la cámara al código de barras del producto.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                className="rounded p-1 text-texto-3 hover:text-texto"
                aria-label="Cerrar escáner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-[10px] border border-borde bg-negro">
              <video
                ref={videoRef}
                className="aspect-square w-full object-cover"
                muted
                playsInline
              />

              {/* Guía visual */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-8 rounded-[8px] border-2 border-dashed border-white/40"
              />

              {iniciando && (
                <div className="absolute inset-0 grid place-items-center bg-negro/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" aria-hidden />
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-[9px] border border-peligro-borde bg-peligro-suave px-3 py-2 text-[11.5px] text-peligro">
                <CameraOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <button type="button" onClick={cerrar} className="btn btn-suave mt-4 w-full">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
