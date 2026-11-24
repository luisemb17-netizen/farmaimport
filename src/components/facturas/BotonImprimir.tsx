"use client";

import { Printer } from "lucide-react";

export function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-suave">
      <Printer className="h-4 w-4" aria-hidden />
      Imprimir
    </button>
  );
}
