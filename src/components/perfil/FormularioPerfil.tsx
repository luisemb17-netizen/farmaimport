"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Loader2, Save } from "lucide-react";
import { perfilSchema, type PerfilInput } from "@/lib/validaciones/auth";
import { actualizarPerfil } from "@/lib/actions/perfil";

export function FormularioPerfil({
  nombreInicial,
  cedulaInicial,
}: {
  nombreInicial: string;
  cedulaInicial: string;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PerfilInput>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre_completo: nombreInicial, cedula: cedulaInicial },
  });

  async function guardar(datos: PerfilInput) {
    const resultado = await actualizarPerfil(datos);

    if (!resultado.ok) {
      toast.error(resultado.mensaje);
      return;
    }

    toast.success(resultado.mensaje);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(guardar)} noValidate className="flex flex-col gap-4">
      <div>
        <label className="etiqueta" htmlFor="nombre_completo">
          Nombre completo
        </label>
        <input id="nombre_completo" className="campo" {...register("nombre_completo")} />
        {errors.nombre_completo && (
          <p className="mt-1 text-[11.5px] font-medium text-peligro">
            {errors.nombre_completo.message}
          </p>
        )}
      </div>

      <div>
        <label className="etiqueta" htmlFor="cedula">
          Cédula
        </label>
        <input
          id="cedula"
          className="campo mono"
          placeholder="V-12345678"
          {...register("cedula")}
        />
        {errors.cedula && (
          <p className="mt-1 text-[11.5px] font-medium text-peligro">{errors.cedula.message}</p>
        )}
      </div>

      <p className="rounded-[9px] border border-borde bg-fondo px-3 py-2 text-[11.5px] text-texto-3">
        Tu rol y tu estado solo los puede cambiar un administrador.
      </p>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primario" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
