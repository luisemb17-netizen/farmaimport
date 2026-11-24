"use client";

import { useEffect } from "react";

/** Registra el service worker de la PWA una vez cargada la página. */
export function RegistroSW() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const temporizador = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sin HTTPS o en modo privado el registro falla: la app sigue funcionando.
      });
    }, 1500);

    return () => window.clearTimeout(temporizador);
  }, []);

  return null;
}
