import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types/database";

export interface SesionActual {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
  perfil: Perfil | null;
}

/**
 * Devuelve el usuario autenticado y su perfil.
 * Usa getUser() (valida el token contra el servidor de Auth), nunca getSession().
 */
export async function obtenerSesion(): Promise<SesionActual> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, perfil: (perfil as Perfil | null) ?? null };
}

/** Igual que obtenerSesion, pero exige rol administrador (protección en el servidor). */
export async function exigirAdmin(): Promise<SesionActual> {
  const sesion = await obtenerSesion();

  if (sesion.perfil?.rol !== "administrador") {
    redirect("/dashboard");
  }

  return sesion;
}

/** ¿Están configuradas las variables de Supabase? */
export function hayConfiguracion(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}
