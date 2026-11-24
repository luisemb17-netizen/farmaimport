"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { cambiarEstadoProducto, eliminarProducto } from "@/lib/actions/productos";

export function AccionesProducto({
  id,
  activo,
  nombre,
}: {
  id: string;
  activo: boolean;
  nombre: string;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function alternar() {
    startTransition(async () => {
      const resultado = await cambiarEstadoProducto(id, !activo);
      if (resultado.ok) toast.success(resultado.mensaje);
      else toast.error(resultado.mensaje);
      router.refresh();
    });
  }

  function borrar() {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente «${nombre}»?\n\nSi el producto ya tiene ventas, el sistema te pedirá desactivarlo en su lugar.`,
    );
    if (!confirmado) return;

    startTransition(async () => {
      const resultado = await eliminarProducto(id);
      if (resultado.ok) toast.success(resultado.mensaje);
      else toast.error(resultado.mensaje);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={alternar}
        disabled={pendiente}
        className="btn btn-suave px-2.5 py-1.5"
        title={activo ? "Desactivar (deja de aparecer en el POS)" : "Activar"}
      >
        {pendiente ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : activo ? (
          <EyeOff className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Eye className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>

      <button
        type="button"
        onClick={borrar}
        disabled={pendiente}
        className="btn btn-peligro px-2.5 py-1.5"
        title="Eliminar producto"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
