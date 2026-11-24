"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  User,
  X,
} from "lucide-react";
import { cerrarSesion } from "@/lib/actions/auth";
import { iniciales } from "@/lib/formato";
import type { Rol } from "@/lib/types/database";

interface ItemNav {
  href: string;
  etiqueta: string;
  icono: typeof LayoutDashboard;
  soloAdmin?: boolean;
}

interface GrupoNav {
  titulo: string;
  items: ItemNav[];
}

const GRUPOS: GrupoNav[] = [
  {
    titulo: "Operación",
    items: [
      { href: "/dashboard", etiqueta: "Panel general", icono: LayoutDashboard },
      { href: "/dashboard/pos", etiqueta: "Punto de venta", icono: ShoppingCart },
      { href: "/dashboard/ventas", etiqueta: "Ventas", icono: Receipt },
    ],
  },
  {
    titulo: "Inventario",
    items: [
      { href: "/dashboard/productos", etiqueta: "Productos", icono: Package },
      { href: "/dashboard/categorias", etiqueta: "Categorías", icono: Tags },
    ],
  },
  {
    titulo: "Administración",
    items: [
      { href: "/dashboard/usuarios", etiqueta: "Usuarios", icono: ShieldCheck, soloAdmin: true },
      { href: "/dashboard/reportes", etiqueta: "Reportes", icono: BarChart3, soloAdmin: true },
      { href: "/dashboard/configuracion", etiqueta: "Configuración", icono: Settings, soloAdmin: true },
      { href: "/dashboard/perfil", etiqueta: "Mi perfil", icono: User },
    ],
  },
];

function estaActivo(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  nombre,
  rol,
  razonSocial,
  abierto,
  onCerrar,
}: {
  nombre: string;
  rol: Rol;
  razonSocial: string;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const pathname = usePathname();
  const esAdmin = rol === "administrador";

  return (
    <>
      {/* Fondo oscuro del menú móvil */}
      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onCerrar}
          className="fixed inset-0 z-40 bg-negro/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col gap-5 border-r border-white/10 bg-negro px-4 py-5 transition-transform duration-200 lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Marca */}
        <div className="flex items-center gap-3 px-2">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onCerrar}>
            <span className="grid h-[42px] w-[42px] place-items-center rounded-[13px] bg-gradient-to-br from-azul to-azul-profundo shadow-[0_10px_24px_-12px_rgba(37,99,235,0.9)]">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <strong className="truncate text-[15.5px] font-bold tracking-tight text-white">
                FarmaImport
              </strong>
              <small className="truncate text-[10.5px] text-[#8f9db5]">
                {razonSocial}
              </small>
            </span>
          </Link>

          <button
            type="button"
            onClick={onCerrar}
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-[#8f9db5] hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {GRUPOS.map((grupo) => {
            const items = grupo.items.filter((i) => !i.soloAdmin || esAdmin);
            if (items.length === 0) return null;

            return (
              <div key={grupo.titulo}>
                <p className="nav-grupo">{grupo.titulo}</p>
                {items.map((item) => {
                  const Icono = item.icono;
                  const activo = estaActivo(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCerrar}
                      data-activo={activo}
                      className="nav-item"
                      aria-current={activo ? "page" : undefined}
                    >
                      <Icono className="h-[17px] w-[17px] shrink-0" aria-hidden />
                      <span>{item.etiqueta}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Usuario + salir */}
        <div className="flex flex-col gap-2 border-t border-white/10 pt-3.5">
          <div className="flex items-center gap-2.5 px-2">
            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3b82f6] to-azul-profundo text-[13px] font-bold text-white">
              {iniciales(nombre)}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <strong className="truncate text-[12.5px] font-semibold text-white">
                {nombre}
              </strong>
              <small className="text-[10.5px] capitalize text-[#8f9db5]">{rol}</small>
            </span>
          </div>

          <form action={cerrarSesion}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[12.5px] text-[#8f9db5] transition hover:bg-peligro/15 hover:text-[#fca5a5]"
            >
              <LogOut className="h-[17px] w-[17px]" aria-hidden />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
