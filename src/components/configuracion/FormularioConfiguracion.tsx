"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { ImageUp, Loader2, Save, Trash2 } from "lucide-react";
import { configuracionSchema, type ConfiguracionInput } from "@/lib/validaciones/configuracion";
import { guardarConfiguracion } from "@/lib/actions/configuracion";
import { createClient } from "@/lib/supabase/client";
import { convertirAWebp } from "@/lib/imagen";
import type { ConfiguracionNegocio } from "@/lib/types/database";

export function FormularioConfiguracion({ config }: { config: ConfiguracionNegocio }) {
  const router = useRouter();
  const [subiendo, setSubiendo] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConfiguracionInput>({
    resolver: zodResolver(configuracionSchema),
    defaultValues: {
      razon_social: config.razon_social,
      rif: config.rif,
      direccion_fiscal: config.direccion_fiscal,
      telefono: config.telefono ?? "",
      porcentaje_iva: Number(config.porcentaje_iva),
      logo_url: config.logo_url ?? "",
    },
  });

  const logo = watch("logo_url");

  async function subirLogo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setSubiendo(true);
    try {
      const supabase = createClient();
      const blob = await convertirAWebp(archivo);
      const nombre = `logo-${crypto.randomUUID()}.webp`;

      const { error } = await supabase.storage
        .from("imagenes")
        .upload(nombre, blob, { contentType: "image/webp", cacheControl: "31536000" });

      if (error) throw error;

      const { data } = supabase.storage.from("imagenes").getPublicUrl(nombre);
      setValue("logo_url", data.publicUrl, { shouldDirty: true });
      toast.success("Logo subido. Recuerda guardar los cambios.");
    } catch {
      toast.error("No se pudo subir el logo. Verifica el bucket «imagenes».");
    } finally {
      setSubiendo(false);
      evento.target.value = "";
    }
  }

  async function guardar(datos: ConfiguracionInput) {
    const resultado = await guardarConfiguracion(datos);

    if (!resultado.ok) {
      toast.error(resultado.mensaje);
      return;
    }

    toast.success(resultado.mensaje);
    router.refresh();
  }

  const claseError = "mt-1 text-[11.5px] font-medium text-peligro";

  return (
    <form onSubmit={handleSubmit(guardar)} noValidate className="flex flex-col gap-4">
      <section className="tarjeta p-5">
        <h2 className="mb-4 text-[15px] font-bold tracking-tight">Datos fiscales del emisor</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="razon_social">
              Razón social
            </label>
            <input id="razon_social" className="campo" {...register("razon_social")} />
            {errors.razon_social && <p className={claseError}>{errors.razon_social.message}</p>}
          </div>

          <div>
            <label className="etiqueta" htmlFor="rif">
              RIF
            </label>
            <input
              id="rif"
              className="campo mono uppercase"
              placeholder="J-12345678-9"
              {...register("rif")}
            />
            {errors.rif && <p className={claseError}>{errors.rif.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="etiqueta" htmlFor="direccion_fiscal">
              Dirección fiscal
            </label>
            <textarea
              id="direccion_fiscal"
              rows={2}
              className="campo resize-y"
              {...register("direccion_fiscal")}
            />
            {errors.direccion_fiscal && (
              <p className={claseError}>{errors.direccion_fiscal.message}</p>
            )}
          </div>

          <div>
            <label className="etiqueta" htmlFor="telefono">
              Teléfono
            </label>
            <input id="telefono" className="campo" placeholder="0212-1234567" {...register("telefono")} />
            {errors.telefono && <p className={claseError}>{errors.telefono.message}</p>}
          </div>

          <div>
            <label className="etiqueta" htmlFor="porcentaje_iva">
              Porcentaje de IVA (%)
            </label>
            <input
              id="porcentaje_iva"
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="campo num"
              {...register("porcentaje_iva", { valueAsNumber: true })}
            />
            {errors.porcentaje_iva && (
              <p className={claseError}>{errors.porcentaje_iva.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Logo */}
      <section className="tarjeta p-5">
        <h2 className="mb-1 text-[15px] font-bold tracking-tight">Logo</h2>
        <p className="mb-4 text-[11.5px] text-texto-3">
          Se guarda en el bucket público «imagenes» de Supabase Storage.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[11px] border border-borde bg-fondo">
            {logo ? (
              <Image
                src={logo}
                alt="Logo del negocio"
                width={80}
                height={80}
                className="h-full w-full object-contain"
              />
            ) : (
              <ImageUp className="h-6 w-6 text-texto-3" aria-hidden />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="btn btn-suave cursor-pointer">
              {subiendo ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ImageUp className="h-4 w-4" aria-hidden />
              )}
              {subiendo ? "Subiendo…" : "Subir logo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={subirLogo}
                disabled={subiendo}
              />
            </label>

            {logo && (
              <button
                type="button"
                className="btn btn-peligro"
                onClick={() => setValue("logo_url", "", { shouldDirty: true })}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Quitar logo
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primario" disabled={isSubmitting || subiendo}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          Guardar configuración
        </button>
      </div>
    </form>
  );
}
