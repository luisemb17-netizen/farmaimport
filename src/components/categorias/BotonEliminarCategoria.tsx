"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Trash2 } from "lucide-react";
import { eliminarCategoria } from "@/lib/actions/productos";

export function BotonEliminarCategoria({
  id,
  nombre,
}: {
  id: string;
  nombre: string;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function borrar() {
    const confirmado = window.confirm(
      `¿Eliminar la categoría «${nombre}»?\n\nLos productos que la usan quedan sin categoría (no se borran).`,
    );
    if (!confirmado) return;

    startTransition(async () => {
      const resultado = await eliminarCategoria(id);
      if (resultado.ok) toast.success(resultado.mensaje);
      else toast.error(resultado.mensaje);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={borrar}
      disabled={pendiente}
      className="btn btn-peligro px-2.5 py-1.5"
      title="Eliminar categoría"
    >
      {pendiente ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
}
