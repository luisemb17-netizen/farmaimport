"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Bell, Calendar, Menu, Plus } from "lucide-react";
import { BotonTema } from "@/components/layout/BotonTema";

const TITULOS: Array<{ prefijo: string; titulo: string; subtitulo: string }> = [
  { prefijo: "/dashboard/ventas", titulo: "Historial de ventas", subtitulo: "Facturas emitidas y su estado" },
  { prefijo: "/dashboard/productos", titulo: "Productos", subtitulo: "Inventario de la farmacia" },
  { prefijo: "/dashboard/categorias", titulo: "Categorías", subtitulo: "Agrupación de productos" },
  { prefijo: "/dashboard/pos", titulo: "Punto de venta", subtitulo: "Caja rápida · carrito y cobro" },
  { prefijo: "/dashboard/usuarios", titulo: "Usuarios", subtitulo: "Roles y acceso al sistema" },
  { prefijo: "/dashboard/reportes", titulo: "Reportes", subtitulo: "Ventas, IVA y productos más vendidos" },
  { prefijo: "/dashboard/configuracion", titulo: "Configuración", subtitulo: "Datos fiscales del negocio" },
  { prefijo: "/dashboard/perfil", titulo: "Mi perfil", subtitulo: "Tus datos de usuario" },
  { prefijo: "/dashboard", titulo: "Panel de control", subtitulo: "Resumen de ventas del día · America/Caracas" },
];

export interface ProductoAgotado {
  id: string;
  nombre: string;
  stock: number;
}

export function Topbar({
  fecha,
  agotados = [],
  onMenu,
}: {
  fecha: string;
  agotados?: ProductoAgotado[];
  onMenu: () => void;
}) {
  const pathname = usePathname();
  const actual =
    TITULOS.find((t) => pathname.startsWith(t.prefijo)) ?? TITULOS[TITULOS.length - 1];

  const esPos = pathname.startsWith("/dashboard/pos");
  const [verAgotados, setVerAgotados] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-borde bg-superficie px-5 py-4 lg:px-7">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="grid h-9 w-9 place-items-center rounded-[9px] border border-borde text-texto-2 transition hover:text-texto lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <div>
          <h1 className="text-[19px] font-bold tracking-tight">{actual.titulo}</h1>
          <p className="mt-0.5 text-[12.5px] text-texto-3">{actual.subtitulo}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <BotonTema />

        {/* Alerta de stock vacío (punto extra) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setVerAgotados((v) => !v)}
            aria-label={
              agotados.length > 0
                ? `${agotados.length} producto(s) agotado(s)`
                : "Sin productos agotados"
            }
            aria-expanded={verAgotados}
            className="relative grid h-9 w-9 place-items-center rounded-[9px] border border-borde text-texto-2 transition hover:border-borde-fuerte hover:text-texto"
          >
            <Bell className="h-[17px] w-[17px]" aria-hidden />
            {agotados.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-peligro px-1 text-[10px] font-bold text-white">
                {agotados.length}
              </span>
            )}
          </button>

          {verAgotados && (
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setVerAgotados(false)}
              />
              <div className="absolute right-0 top-11 z-40 w-[290px] rounded-[12px] border border-borde bg-superficie p-2 shadow-[0_22px_48px_-30px_rgba(15,23,42,0.55)]">
                <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-texto-3">
                  Stock vacío
                </p>

                {agotados.length === 0 ? (
                  <p className="px-2 py-3 text-[12px] text-texto-2">
                    Todo el inventario tiene existencias. 🎉
                  </p>
                ) : (
                  <>
                    <ul className="max-h-[260px] overflow-y-auto">
                      {agotados.slice(0, 8).map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/dashboard/productos/${p.id}`}
                            onClick={() => setVerAgotados(false)}
                            className="flex items-center gap-2 rounded-[8px] px-2 py-2 text-[12px] text-texto-2 transition hover:bg-fondo-2 hover:text-texto"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-peligro" aria-hidden />
                            <span className="min-w-0 flex-1 truncate">{p.nombre}</span>
                            <span className="shrink-0 rounded-full bg-peligro-suave px-1.5 py-0.5 text-[10px] font-bold text-peligro">
                              0
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/dashboard/productos"
                      onClick={() => setVerAgotados(false)}
                      className="mt-1 block rounded-[8px] px-2 py-2 text-center text-[11.5px] font-semibold text-azul hover:bg-fondo-2"
                    >
                      Ver todo el inventario
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <span className="hidden items-center gap-1.5 rounded-full border border-borde bg-fondo px-3 py-1.5 text-[11.5px] font-semibold text-texto-2 sm:inline-flex">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          {fecha}
        </span>

        <span className="hidden items-center gap-2 rounded-full border border-ok-borde bg-ok-suave px-3 py-1.5 text-[11.5px] font-bold text-ok md:inline-flex">
          <span className="h-[7px] w-[7px] rounded-full bg-ok shadow-[0_0_0_3px_rgba(5,150,105,0.15)]" />
          Sistema en línea
        </span>

        {!esPos && (
          <Link href="/dashboard/pos" className="btn btn-primario">
            <Plus className="h-4 w-4" aria-hidden />
            Nueva venta
          </Link>
        )}
      </div>
    </header>
  );
}
