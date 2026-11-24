"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registroSchema } from "@/lib/validaciones/auth";
import type { ActionResult } from "@/lib/types/database";

/** Traduce los mensajes de error de Supabase Auth al español. */
function mensajeAuth(mensaje: string): string {
  const texto = mensaje.toLowerCase();

  if (texto.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (texto.includes("email not confirmed")) {
    return "Debes confirmar tu correo antes de entrar. Revisa tu bandeja.";
  }
  if (texto.includes("user already registered") || texto.includes("already been registered")) {
    return "Ya existe una cuenta con ese correo.";
  }
  if (texto.includes("password should be at least")) {
    return "La contraseña es demasiado corta.";
  }
  if (texto.includes("rate limit") || texto.includes("too many requests")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  }
  if (texto.includes("failed to fetch") || texto.includes("network")) {
    return "No se pudo conectar con Supabase. Revisa tu conexión y las variables de entorno.";
  }
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

export async function iniciarSesion(entrada: {
  email: string;
  password: string;
}): Promise<ActionResult> {
  const validacion = loginSchema.safeParse(entrada);
  if (!validacion.success) {
    return {
      ok: false,
      mensaje: validacion.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validacion.data.email,
    password: validacion.data.password,
  });

  if (error) {
    return { ok: false, mensaje: mensajeAuth(error.message) };
  }

  return { ok: true, mensaje: "Sesión iniciada" };
}

export async function registrarse(entrada: {
  nombre_completo: string;
  cedula: string;
  email: string;
  password: string;
  confirmar: string;
}): Promise<ActionResult<{ requiereConfirmacion: boolean }>> {
  const validacion = registroSchema.safeParse(entrada);
  if (!validacion.success) {
    return {
      ok: false,
      mensaje: validacion.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: validacion.data.email,
    password: validacion.data.password,
    options: {
      // Estos metadatos los usa el trigger crear_perfil() en PostgreSQL.
      data: {
        nombre_completo: validacion.data.nombre_completo,
        cedula: validacion.data.cedula.toUpperCase(),
      },
    },
  });

  if (error) {
    return { ok: false, mensaje: mensajeAuth(error.message) };
  }

  // Si "Confirm email" está activo, Supabase no devuelve sesión.
  const requiereConfirmacion = !data.session;

  return {
    ok: true,
    mensaje: requiereConfirmacion
      ? "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión."
      : "Cuenta creada correctamente.",
    data: { requiereConfirmacion },
  };
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
