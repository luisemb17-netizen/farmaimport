"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Power } from "lucide-react";
import { cambiarActivo, cambiarRol } from "@/lib/actions/usuarios";
import type { Rol } from "@/lib/types/database";

export function AccionesUsuario({
  usuarioId,
  rol,
  activo,
  esUnoMismo,
}: {
  usuarioId: string;
  rol: Rol;
  activo: boolean;
  esUnoMismo: boolean;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function onCambiarRol(nuevo: Rol) {
    startTransition(async () => {
      const resultado = await cambiarRol(usuarioId, nuevo);
      if (resultado.ok) toast.success(resultado.mensaje);
      else toast.error(resultado.mensaje);
      router.refresh();
    });
  }

  function onAlternarActivo() {
    startTransition(async () => {
      const resultado = await cambiarActivo(usuarioId, !activo);
      if (resultado.ok) toast.success(resultado.mensaje);
      else toast.error(resultado.mensaje);
      router.refresh();
    });
  }

  if (esUnoMismo) {
    return (
      <span className="text-[11.5px] text-texto-3">Tu cuenta</span>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <select
        value={rol}
        disabled={pendiente}
        onChange={(e) => onCambiarRol(e.target.value as Rol)}
        className="campo h-8 w-auto py-0 text-[12px]"
        aria-label="Cambiar rol"
      >
        <option value="cajero">Cajero</option>
        <option value="administrador">Administrador</option>
      </select>

      <button
        type="button"
        onClick={onAlternarActivo}
        disabled={pendiente}
        className={`btn px-2.5 py-1.5 ${activo ? "btn-peligro" : "btn-suave"}`}
        title={activo ? "Desactivar usuario" : "Activar usuario"}
      >
        {pendiente ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Power className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
    </div>
  );
}
