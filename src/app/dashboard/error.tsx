"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="tarjeta max-w-lg p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-peligro-suave text-peligro">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-bold">Algo salió mal</h2>
        <p className="mt-2 text-[13px] text-texto-2">
          No se pudo cargar esta sección. Revisa que las migraciones SQL estén
          ejecutadas y que las variables de Supabase sean correctas.
        </p>
        {error.digest && (
          <p className="mono mt-2 text-[11px] text-texto-3">ref: {error.digest}</p>
        )}
        <button type="button" onClick={reset} className="btn btn-primario mx-auto mt-5">
          <RotateCcw className="h-4 w-4" aria-hidden />
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
