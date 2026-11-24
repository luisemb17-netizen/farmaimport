"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth/sesion";
import { nuevoUsuarioSchema } from "@/lib/validaciones/auth";
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


/**
 * Crea un usuario nuevo (solo administrador).
 * Llama a la función SQL crear_usuario(), que inserta en auth.users,
 * auth.identities y perfiles sin exponer la service_role key en la app.
 */
export async function crearUsuario(datos: unknown): Promise<ActionResult> {
  const { supabase } = await exigirAdmin();

  const validacion = nuevoUsuarioSchema.safeParse(datos);
  if (!validacion.success) {
    return {
      ok: false,
      mensaje: validacion.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const d = validacion.data;
  const cedula = d.cedula && d.cedula.trim() !== "" ? d.cedula.trim() : null;

  const { error } = await supabase.rpc("crear_usuario", {
    p_email: d.email,
    p_password: d.password,
    p_nombre_completo: d.nombre_completo,
    p_cedula: cedula,
    p_rol: d.rol,
  });

  if (error) {
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/dashboard/usuarios");
  return {
    ok: true,
    mensaje: `Usuario ${d.email} creado como ${d.rol}.`,
  };
}
