"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Plus } from "lucide-react";
import { crearCategoria } from "@/lib/actions/productos";

export function FormularioCategoria() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);

    const resultado = await crearCategoria({ nombre, descripcion });

    if (resultado.ok) {
      toast.success(resultado.mensaje);
      setNombre("");
      setDescripcion("");
      router.refresh();
    } else {
      toast.error(resultado.mensaje);
    }

    setEnviando(false);
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="etiqueta" htmlFor="nombre-categoria">
          Nombre
        </label>
        <input
          id="nombre-categoria"
          className="campo"
          placeholder="Analgésicos y Antiinflamatorios"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          minLength={2}
        />
      </div>

      <div className="flex-1">
        <label className="etiqueta" htmlFor="desc-categoria">
          Descripción (opcional)
        </label>
        <input
          id="desc-categoria"
          className="campo"
          placeholder="Dolor, fiebre e inflamación"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primario" disabled={enviando}>
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Plus className="h-4 w-4" aria-hidden />
        )}
        Agregar
      </button>
    </form>
  );
}
