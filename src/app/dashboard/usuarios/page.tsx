import type { Metadata } from "next";
import { ShieldCheck, UserCog } from "lucide-react";
import { exigirAdmin } from "@/lib/auth/sesion";
import { formatoFecha } from "@/lib/formato";
import { Insignia } from "@/components/ui/Insignia";
import { AccionesUsuario } from "@/components/usuarios/AccionesUsuario";
import type { Perfil } from "@/lib/types/database";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsuariosPage() {
  const { supabase, user } = await exigirAdmin();

  const { data } = await supabase
    .from("perfiles")
    .select("*")
    .order("created_at", { ascending: true });

  const usuarios = (data ?? []) as Perfil[];

  return (
    <div className="flex flex-col gap-4">
      <section className="tarjeta p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-azul-suave text-azul">
            <UserCog className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Gestión de usuarios</h2>
            <p className="mt-0.5 text-[12px] text-texto-2">
              Cambia roles y activa o desactiva cuentas. El rol y el estado están protegidos
              por un trigger: solo un administrador puede modificarlos.
            </p>
          </div>
        </div>
      </section>

      <section className="tarjeta p-4">
        <div className="mb-3">
          <h2 className="text-[15px] font-bold tracking-tight">Usuarios registrados</h2>
          <p className="mt-0.5 text-[11.5px] text-texto-3">
            {usuarios.length} cuenta{usuarios.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Cédula</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Alta</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3b82f6] to-azul-profundo text-[11px] font-bold text-white">
                        {u.nombre_completo.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-texto">
                          {u.nombre_completo}
                          {u.id === user.id && (
                            <span className="ml-1.5 text-[10.5px] font-normal text-texto-3">(tú)</span>
                          )}
                        </p>
                        <p className="truncate text-[11px] text-texto-3">{u.email ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{u.cedula ?? "—"}</td>
                  <td>
                    <Insignia tono={u.rol === "administrador" ? "info" : "neutro"}>
                      {u.rol === "administrador" ? (
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" aria-hidden />
                          Administrador
                        </span>
                      ) : (
                        "Cajero"
                      )}
                    </Insignia>
                  </td>
                  <td>
                    <Insignia tono={u.activo ? "ok" : "peligro"}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Insignia>
                  </td>
                  <td className="whitespace-nowrap text-[12px]">{formatoFecha(u.created_at)}</td>
                  <td>
                    <AccionesUsuario
                      usuarioId={u.id}
                      rol={u.rol}
                      activo={u.activo}
                      esUnoMismo={u.id === user.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
