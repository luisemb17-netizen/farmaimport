"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const CLAVE_TEMA = "farmaimport-tema";

/**
 * Alterna entre tema claro y oscuro y recuerda la preferencia en localStorage.
 * El atributo data-tema del <html> lo aplica un script en el layout raíz antes
 * del primer pintado, así que no hay parpadeo al cargar.
 */
export function BotonTema({ className = "" }: { className?: string }) {
  const [oscuro, setOscuro] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setOscuro(document.documentElement.getAttribute("data-tema") === "oscuro");
    setMontado(true);
  }, []);

  function alternar() {
    const nuevo = !oscuro;
    setOscuro(nuevo);

    const raiz = document.documentElement;
    if (nuevo) raiz.setAttribute("data-tema", "oscuro");
    else raiz.removeAttribute("data-tema");

    try {
      localStorage.setItem(CLAVE_TEMA, nuevo ? "oscuro" : "claro");
    } catch {
      // Modo privado sin almacenamiento: el tema igual funciona en esta sesión.
    }
  }

  const etiqueta = oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={etiqueta}
      title={etiqueta}
      className={`grid h-9 w-9 place-items-center rounded-[9px] border border-borde text-texto-2 transition hover:border-borde-fuerte hover:text-texto ${className}`}
    >
      {montado && oscuro ? (
        <Sun className="h-[17px] w-[17px]" aria-hidden />
      ) : (
        <Moon className="h-[17px] w-[17px]" aria-hidden />
      )}
    </button>
  );
}
