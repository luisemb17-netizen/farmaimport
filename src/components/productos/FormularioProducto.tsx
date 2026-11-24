"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { ImageUp, Loader2, Save, Trash2, X } from "lucide-react";
import { productoSchema, type ProductoInput } from "@/lib/validaciones/producto";
import type { Categoria, Producto } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { actualizarProducto, crearProducto } from "@/lib/actions/productos";
import { convertirAWebp } from "@/lib/imagen";

export function FormularioProducto({
  producto,
  categorias,
}: {
  producto?: Producto;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [subiendo, setSubiendo] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductoInput>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      codigo: producto?.codigo ?? "",
      nombre: producto?.nombre ?? "",
      descripcion: producto?.descripcion ?? "",
      laboratorio: producto?.laboratorio ?? "",
      presentacion: producto?.presentacion ?? "",
      precio_unitario: Number(producto?.precio_unitario ?? 0),
      stock: Number(producto?.stock ?? 0),
      categoria_id: producto?.categoria_id ?? null,
      exento: producto?.exento ?? false,
      activo: producto?.activo ?? true,
      imagen_url: producto?.imagen_url ?? "",
    },
  });

  const imagenUrl = watch("imagen_url");
  const exento = watch("exento");

  async function subirImagen(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setSubiendo(true);
    try {
      const supabase = createClient();
      const blob = await convertirAWebp(archivo);
      // Nombre único para que el navegador no muestre la foto vieja en caché.
      const nombre = `${crypto.randomUUID()}.webp`;

      const { error } = await supabase.storage
        .from("imagenes")
        .upload(nombre, blob, { contentType: "image/webp", cacheControl: "31536000" });

      if (error) throw error;

      const { data } = supabase.storage.from("imagenes").getPublicUrl(nombre);
      setValue("imagen_url", data.publicUrl, { shouldDirty: true });
      toast.success("Imagen subida.");
    } catch {
      toast.error(
        "No se pudo subir la imagen. Verifica el bucket «imagenes» y que seas administrador.",
      );
    } finally {
      setSubiendo(false);
      evento.target.value = "";
    }
  }

  async function guardar(datos: ProductoInput) {
    const resultado = producto
      ? await actualizarProducto(producto.id, datos)
      : await crearProducto(datos);

    if (!resultado.ok) {
      toast.error(resultado.mensaje);
      return;
    }

    toast.success(resultado.mensaje);
    router.push("/dashboard/productos");
    router.refresh();
  }

  const claseError = "mt-1 text-[11.5px] font-medium text-peligro";

  return (
    <form onSubmit={handleSubmit(guardar)} noValidate className="flex flex-col gap-4">
      <section className="tarjeta p-5">
        <h2 className="mb-4 text-[15px] font-bold tracking-tight">Datos del producto</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="codigo">
              Código (SKU)
            </label>
            <input
              id="codigo"
              className="campo uppercase"
              placeholder="ANL-001"
              {...register("codigo")}
            />
            {errors.codigo && <p className={claseError}>{errors.codigo.message}</p>}
          </div>

          <div>
            <label className="etiqueta" htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              className="campo"
              placeholder="Acetaminofén 500 mg"
              {...register("nombre")}
            />
            {errors.nombre && <p className={claseError}>{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="etiqueta" htmlFor="laboratorio">
              Laboratorio
            </label>
            <input
              id="laboratorio"
              className="campo"
              placeholder="Genven"
              {...register("laboratorio")}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="presentacion">
              Presentación
            </label>
            <input
              id="presentacion"
              className="campo"
              placeholder="Caja x 10 tabletas"
              {...register("presentacion")}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="precio_unitario">
              Precio unitario (Bs.)
            </label>
            <input
              id="precio_unitario"
              type="number"
              step="0.01"
              min="0"
              className="campo num"
              placeholder="0,00"
              {...register("precio_unitario", { valueAsNumber: true })}
            />
            {errors.precio_unitario && (
              <p className={claseError}>{errors.precio_unitario.message}</p>
            )}
          </div>

          <div>
            <label className="etiqueta" htmlFor="stock">
              Stock
            </label>
            <input
              id="stock"
              type="number"
              step="1"
              min="0"
              className="campo num"
              placeholder="0"
              {...register("stock", { valueAsNumber: true })}
            />
            {errors.stock && <p className={claseError}>{errors.stock.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="etiqueta" htmlFor="categoria_id">
              Categoría
            </label>
            <select
              id="categoria_id"
              className="campo"
              {...register("categoria_id", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="etiqueta" htmlFor="descripcion">
              Descripción
            </label>
            <textarea
              id="descripcion"
              rows={3}
              className="campo resize-y"
              placeholder="Analgésico y antipirético de venta libre"
              {...register("descripcion")}
            />
          </div>
        </div>
      </section>

      {/* ---------- Impuesto y estado ---------- */}
      <section className="tarjeta p-5">
        <h2 className="mb-4 text-[15px] font-bold tracking-tight">Impuesto y estado</h2>

        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-borde p-3.5 transition hover:border-borde-fuerte">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-azul"
              {...register("exento")}
            />
            <span>
              <span className="block text-[13px] font-semibold">Producto exento de IVA (E)</span>
              <span className="block text-[11.5px] text-texto-3">
                No entra en la base imponible y se totaliza aparte en la factura.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-borde p-3.5 transition hover:border-borde-fuerte">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-azul"
              {...register("activo")}
            />
            <span>
              <span className="block text-[13px] font-semibold">Producto activo</span>
              <span className="block text-[11.5px] text-texto-3">
                Si lo desactivas, deja de aparecer en el punto de venta pero conserva su historial.
              </span>
            </span>
          </label>
        </div>

        {exento && (
          <p className="mt-3 rounded-[9px] border border-azul-borde bg-azul-suave px-3 py-2 text-[11.5px] text-azul-oscuro">
            Este producto se mostrará con la marca <b>(E)</b> en la factura.
          </p>
        )}
      </section>

      {/* ---------- Imagen ---------- */}
      <section className="tarjeta p-5">
        <h2 className="mb-1 text-[15px] font-bold tracking-tight">Imagen</h2>
        <p className="mb-4 text-[11.5px] text-texto-3">
          Se guarda en Supabase Storage con un nombre único en formato WebP.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-[11px] border border-borde bg-fondo">
            {imagenUrl ? (
              <Image
                src={imagenUrl}
                alt="Imagen del producto"
                width={96}
                height={96}
                className="h-full w-full object-cover"
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
              <span>{subiendo ? "Subiendo…" : "Subir imagen"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={subirImagen}
                disabled={subiendo}
              />
            </label>

            {imagenUrl && (
              <button
                type="button"
                className="btn btn-peligro"
                onClick={() => setValue("imagen_url", "", { shouldDirty: true })}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Quitar imagen
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Acciones ---------- */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="btn btn-suave"
          onClick={() => router.push("/dashboard/productos")}
        >
          <X className="h-4 w-4" aria-hidden />
          Cancelar
        </button>
        <button type="submit" className="btn btn-primario" disabled={isSubmitting || subiendo}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {producto ? "Guardar cambios" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
