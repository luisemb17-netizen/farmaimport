"use client";

import { Toaster } from "react-hot-toast";

/** Contenedor de notificaciones (react-hot-toast) con los colores del proyecto. */
export function ProveedorToasts() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: "#0b1220",
          color: "#ffffff",
          fontSize: "13px",
          borderRadius: "10px",
          padding: "12px 16px",
          boxShadow: "0 22px 48px -30px rgba(15,23,42,0.55)",
        },
        success: { iconTheme: { primary: "#059669", secondary: "#ffffff" } },
        error: { iconTheme: { primary: "#dc2626", secondary: "#ffffff" } },
      }}
    />
  );
}
