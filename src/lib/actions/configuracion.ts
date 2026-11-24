"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth/sesion";
import { configuracionSchema } from "@/lib/validaciones/configuracion";
import type { ActionResult } from "@/lib/types/database";

function opcional(valor: string | undefined | null): string | null {
  const texto = (valor ?? "").trim();
  return texto === "" ? null : texto;
}

/** Guarda los datos fiscales del negocio. Solo administrador. */
export async function guardarConfiguracion(datos: unknown): Promise<ActionResult> {
  const { supabase } = await exigirAdmin();

  const validacion = configuracionSchema.safeParse(datos);
  if (!validacion.success) {
    return {
      ok: false,
      mensaje: validacion.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const d = validacion.data;

  // La tabla tiene una sola fila: se busca su id para actualizarla.
  const { data: actual } = await supabase
    .from("configuracion_negocio")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!actual) {
    return {
      ok: false,
      mensaje: "No existe la fila de configuración. Ejecuta 001_modulo1.sql.",
    };
  }

  const { error } = await supabase
    .from("configuracion_negocio")
    .update({
      razon_social: d.razon_social,
      rif: d.rif.toUpperCase(),
      direccion_fiscal: d.direccion_fiscal,
      telefono: opcional(d.telefono),
      porcentaje_iva: d.porcentaje_iva,
      logo_url: opcional(d.logo_url),
      updated_at: new Date().toISOString(),
    })
    .eq("id", (actual as { id: string }).id);

  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard/pos");

  return { ok: true, mensaje: "Configuración guardada." };
}
