"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar, type ProductoAgotado } from "@/components/layout/Topbar";
import type { Rol } from "@/lib/types/database";

/**
 * Armazón del panel: sidebar fija + topbar + contenido.
 * Es cliente solo para manejar el menú móvil; el contenido llega como
 * children ya renderizado en el servidor.
 */
export function DashboardShell({
  nombre,
  rol,
  razonSocial,
  fecha,
  agotados = [],
  children,
}: {
  nombre: string;
  rol: Rol;
  razonSocial: string;
  fecha: string;
  agotados?: ProductoAgotado[];
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  // Al navegar, se cierra el menú móvil.
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <Sidebar
        nombre={nombre}
        rol={rol}
        razonSocial={razonSocial}
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-[268px]">
        <Topbar fecha={fecha} agotados={agotados} onMenu={() => setAbierto(true)} />

        <main className="flex-1 px-5 py-5 lg:px-7">{children}</main>

        <footer className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-[11.5px] text-texto-3 lg:px-7">
          <span>FarmaImport, C.A. · Simulación SENIAT · Documento sin validez fiscal</span>
          <span className="mono">v1.0</span>
        </footer>
      </div>
    </div>
  );
}
