"use server";

import { revalidatePath } from "next/cache";
import { obtenerSesion } from "@/lib/auth/sesion";
import { perfilSchema } from "@/lib/validaciones/auth";
import type { ActionResult } from "@/lib/types/database";

/**
 * El usuario edita su propio nombre y cédula.
 * El rol y el estado NO se tocan aquí: los protege el trigger proteger_rol().
 */
export async function actualizarPerfil(datos: {
  nombre_completo: string;
  cedula: string;
}): Promise<ActionResult> {
  const { supabase, user } = await obtenerSesion();

  const validacion = perfilSchema.safeParse(datos);
  if (!validacion.success) {
    return {
      ok: false,
      mensaje: validacion.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre_completo: validacion.data.nombre_completo,
      cedula: validacion.data.cedula.toUpperCase(),
    })
    .eq("id", user.id);

  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");

  return { ok: true, mensaje: "Perfil actualizado." };
}
