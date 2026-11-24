"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth/sesion";
import { categoriaSchema, productoSchema } from "@/lib/validaciones/producto";
import type { ActionResult } from "@/lib/types/database";

/** Normaliza los campos opcionales vacíos a null. */
function opcional(valor: string | undefined | null): string | null {
  const texto = (valor ?? "").trim();
  return texto === "" ? null : texto;
}

function primerError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Datos inválidos";
}

export async function crearProducto(
  datos: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await exigirAdmin();

  const validacion = productoSchema.safeParse(datos);
  if (!validacion.success) {
    return { ok: false, mensaje: primerError(validacion.error.issues) };
  }

  const d = validacion.data;

  const { data, error } = await supabase
    .from("productos")
    .insert({
      codigo: d.codigo.toUpperCase(),
      nombre: d.nombre,
      descripcion: opcional(d.descripcion),
      laboratorio: opcional(d.laboratorio),
      presentacion: opcional(d.presentacion),
      precio_unitario: d.precio_unitario,
      stock: d.stock,
      categoria_id: d.categoria_id ?? null,
      exento: d.exento,
      activo: d.activo,
      imagen_url: opcional(d.imagen_url),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, mensaje: `Ya existe un producto con el código ${d.codigo.toUpperCase()}.` };
    }
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/dashboard/productos");
  return {
    ok: true,
    mensaje: "Producto creado correctamente.",
    data: { id: (data as { id: string }).id },
  };
}

export async function actualizarProducto(
  id: string,
  datos: unknown,
): Promise<ActionResult> {
  const { supabase } = await exigirAdmin();

  const validacion = productoSchema.safeParse(datos);
  if (!validacion.success) {
    return { ok: false, mensaje: primerError(validacion.error.issues) };
  }

  const d = validacion.data;

  const { error } = await supabase
    .from("productos")
    .update({
      codigo: d.codigo.toUpperCase(),
      nombre: d.nombre,
      descripcion: opcional(d.descripcion),
      laboratorio: opcional(d.laboratorio),
      presentacion: opcional(d.presentacion),
      precio_unitario: d.precio_unitario,
      stock: d.stock,
      categoria_id: d.categoria_id ?? null,
      exento: d.exento,
      activo: d.activo,
      imagen_url: opcional(d.imagen_url),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, mensaje: `Ya existe un producto con el código ${d.codigo.toUpperCase()}.` };
    }
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/dashboard/productos");
  revalidatePath(`/dashboard/productos/${id}`);
  return { ok: true, mensaje: "Producto actualizado." };
}

export async function cambiarEstadoProducto(
  id: string,
  activo: boolean,
): Promise<ActionResult> {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase
    .from("productos")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/dashboard/productos");
  revalidatePath(`/dashboard/productos/${id}`);
  return {
    ok: true,
    mensaje: activo ? "Producto activado." : "Producto desactivado (ya no aparece en el POS).",
  };
}

export async function eliminarProducto(id: string): Promise<ActionResult> {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase.from("productos").delete().eq("id", id);

  if (error) {
    // 23503 = llave foránea: el producto tiene ventas, nunca se borra.
    if (error.code === "23503") {
      return {
        ok: false,
        mensaje:
          "Este producto ya tiene ventas registradas. No se puede borrar: desactívalo para que desaparezca del POS.",
      };
    }
    if (error.code === "42501") {
      return { ok: false, mensaje: "Solo un administrador puede eliminar productos." };
    }
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/dashboard/productos");
  return { ok: true, mensaje: "Producto eliminado." };
}

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------
export async function crearCategoria(datos: unknown): Promise<ActionResult> {
  const { supabase } = await exigirAdmin();

  const validacion = categoriaSchema.safeParse(datos);
  if (!validacion.success) {
    return { ok: false, mensaje: primerError(validacion.error.issues) };
  }

  const { error } = await supabase.from("categorias").insert({
    nombre: validacion.data.nombre,
    descripcion: opcional(validacion.data.descripcion),
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, mensaje: "Ya existe una categoría con ese nombre." };
    }
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/dashboard/categorias");
  revalidatePath("/dashboard/productos");
  return { ok: true, mensaje: "Categoría creada." };
}

export async function eliminarCategoria(id: string): Promise<ActionResult> {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase.from("categorias").delete().eq("id", id);

  if (error) {
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/dashboard/categorias");
  revalidatePath("/dashboard/productos");
  return { ok: true, mensaje: "Categoría eliminada (los productos quedan sin categoría)." };
}
