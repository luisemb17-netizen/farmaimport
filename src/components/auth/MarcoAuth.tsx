import type { ReactNode } from "react";
import { BarChart3, FileText, ShieldCheck, ShoppingCart } from "lucide-react";
import { BotonTema } from "@/components/layout/BotonTema";

/**
 * Marco visual compartido por /login y /registro.
 * Tarjeta partida: panel lateral oscuro + formulario blanco.
 */
export function MarcoAuth({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid min-h-screen place-items-center bg-fondo p-6">
      <BotonTema className="absolute right-5 top-5 z-10 bg-superficie" />
      <div className="grid w-full max-w-[940px] overflow-hidden rounded-[20px] border border-borde bg-superficie shadow-[0_30px_70px_-40px_rgba(15,23,42,0.55)] lg:grid-cols-[340px_1fr]">
        {/* ---------- Lateral oscuro ---------- */}
        <aside className="relative hidden overflow-hidden bg-negro p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-44 h-[420px] w-[420px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(37,99,235,0.45), transparent 65%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-44 -left-28 h-[320px] w-[320px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(29,78,216,0.30), transparent 68%)",
            }}
          />

          <div className="relative">
            <div className="grid h-[54px] w-[54px] place-items-center rounded-[15px] bg-gradient-to-br from-azul to-azul-profundo shadow-[0_14px_30px_-14px_rgba(37,99,235,0.95)]">
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
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
            </div>

            <h2 className="mt-5 text-[23px] font-bold tracking-tight">
              FarmaImport, C.A.
            </h2>
            <p className="mt-1 max-w-[250px] text-[13.5px] text-[#9fb0ca]">
              Punto de venta, inventario y facturación con formato SENIAT.
            </p>

            <ul className="mt-7 flex flex-col gap-3.5">
              <li className="flex items-center gap-2.5 text-[13px] text-[#c3cfe2]">
                <BarChart3 className="h-4 w-4 text-[#60a5fa]" aria-hidden />
                Panel con métricas de ventas del día
              </li>
              <li className="flex items-center gap-2.5 text-[13px] text-[#c3cfe2]">
                <ShoppingCart className="h-4 w-4 text-[#60a5fa]" aria-hidden />
                Punto de venta rápido con carrito
              </li>
              <li className="flex items-center gap-2.5 text-[13px] text-[#c3cfe2]">
                <FileText className="h-4 w-4 text-[#60a5fa]" aria-hidden />
                Facturas con IVA, control y PDF
              </li>
              <li className="flex items-center gap-2.5 text-[13px] text-[#c3cfe2]">
                <ShieldCheck className="h-4 w-4 text-[#60a5fa]" aria-hidden />
                Roles y acceso protegido
              </li>
            </ul>
          </div>

          <span className="relative mt-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5d6b85]">
            <span className="h-1.5 w-1.5 rounded-full bg-azul" aria-hidden />
            Simulación académica · SENIAT
          </span>
        </aside>

        {/* ---------- Formulario ---------- */}
        <div className="flex flex-col justify-center p-8 sm:p-11">{children}</div>
      </div>
    </div>
  );
}
