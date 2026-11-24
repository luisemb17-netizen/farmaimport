import type { Metadata } from "next";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { obtenerSesion } from "@/lib/auth/sesion";
import { formatoFecha, iniciales } from "@/lib/formato";
import { Insignia } from "@/components/ui/Insignia";
import { FormularioPerfil } from "@/components/perfil/FormularioPerfil";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const { user, perfil } = await obtenerSesion();

  const nombre =
    perfil?.nombre_completo ??
    (typeof user.user_metadata?.nombre_completo === "string"
      ? user.user_metadata.nombre_completo
      : null) ??
    user.email ??
    "Usuario";

  const cedula =
    perfil?.cedula ??
    (typeof user.user_metadata?.cedula === "string" ? user.user_metadata.cedula : "") ??
    "";

  return (
    <div className="flex flex-col gap-4">
      <section className="tarjeta flex flex-wrap items-center gap-4 p-5">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#3b82f6] to-azul-profundo text-[22px] font-black text-white">
          {iniciales(nombre)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[18px] font-bold tracking-tight">{nombre}</h2>
            <Insignia tono={perfil?.rol === "administrador" ? "info" : "neutro"}>
              <span className="inline-flex items-center gap-1 capitalize">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                {perfil?.rol ?? "cajero"}
              </span>
            </Insignia>
            <Insignia tono={perfil?.activo === false ? "peligro" : "ok"}>
              {perfil?.activo === false ? "Inactivo" : "Activo"}
            </Insignia>
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-texto-2">
            <Mail className="h-3.5 w-3.5 text-texto-3" aria-hidden />
            {user.email}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-texto-2">
            <UserRound className="h-3.5 w-3.5 text-texto-3" aria-hidden />
            {cedula || "Cédula sin registrar"}
            {perfil?.created_at && (
              <span className="text-texto-3"> · alta {formatoFecha(perfil.created_at)}</span>
            )}
          </p>
        </div>
      </section>

      <section className="tarjeta max-w-xl p-5">
        <h2 className="mb-1 text-[15px] font-bold tracking-tight">Editar mis datos</h2>
        <p className="mb-4 text-[11.5px] text-texto-3">
          Solo puedes cambiar tu nombre y tu cédula.
        </p>
        <FormularioPerfil nombreInicial={nombre} cedulaInicial={cedula} />
      </section>
    </div>
  );
}
