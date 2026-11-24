import type { ReactNode } from "react";
import { AvisoConfiguracion } from "@/components/layout/AvisoConfiguracion";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { hayConfiguracion, obtenerSesion } from "@/lib/auth/sesion";
import { formatoFecha } from "@/lib/formato";
import type { ConfiguracionNegocio } from "@/lib/types/database";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Sin credenciales no tiene sentido consultar Supabase: se muestra la guía.
  if (!hayConfiguracion()) {
    return <AvisoConfiguracion />;
  }

  const { supabase, user, perfil } = await obtenerSesion();

  const { data } = await supabase
    .from("configuracion_negocio")
    .select("*")
    .limit(1)
    .maybeSingle();

  // Alerta de stock vacío: productos activos sin existencias.
  const { data: sinStock } = await supabase
    .from("productos")
    .select("id, nombre, stock")
    .eq("activo", true)
    .lte("stock", 0)
    .order("nombre")
    .limit(50);

  const agotados = (sinStock ?? []) as { id: string; nombre: string; stock: number }[];

  const config = data as ConfiguracionNegocio | null;
  const razonSocial = config?.razon_social ?? "FarmaImport, C.A.";

  const nombre =
    perfil?.nombre_completo ??
    (typeof user.user_metadata?.nombre_completo === "string"
      ? user.user_metadata.nombre_completo
      : null) ??
    user.email ??
    "Usuario";

  return (
    <DashboardShell
      nombre={nombre}
      rol={perfil?.rol ?? "cajero"}
      razonSocial={razonSocial}
      fecha={formatoFecha(new Date())}
      agotados={agotados}
    >
      {children}
    </DashboardShell>
  );
}
