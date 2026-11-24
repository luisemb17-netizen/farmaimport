"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth/sesion";
import type { ActionResult, Rol } from "@/lib/types/database";

/** Cambia el rol de un usuario. Un administrador no puede cambiarse el suyo. */
export async function cambiarRol(
  usuarioId: string,
  rol: Rol,
): Promise<ActionResult> {
  const { supabase, user } = await exigirAdmin();

  if (usuarioId === user.id) {
    return {
      ok: false,
      mensaje: "No puedes cambiar tu propio rol: pídeselo a otro administrador.",
    };
  }

  if (rol !== "administrador" && rol !== "cajero") {
    return { ok: false, mensaje: "Rol inválido." };
  }

  const { error } = await supabase.from("perfiles").update({ rol }).eq("id", usuarioId);

  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/dashboard/usuarios");
  return {
    ok: true,
    mensaje: `Rol actualizado a ${rol === "administrador" ? "administrador" : "cajero"}.`,
  };
}

/** Activa o desactiva un usuario. Tampoco se puede desactivar a uno mismo. */
export async function cambiarActivo(
  usuarioId: string,
  activo: boolean,
): Promise<ActionResult> {
  const { supabase, user } = await exigirAdmin();

  if (usuarioId === user.id) {
    return { ok: false, mensaje: "No puedes desactivar tu propia cuenta." };
  }

  const { error } = await supabase.from("perfiles").update({ activo }).eq("id", usuarioId);

  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/dashboard/usuarios");
  return { ok: true, mensaje: activo ? "Usuario activado." : "Usuario desactivado." };
}
