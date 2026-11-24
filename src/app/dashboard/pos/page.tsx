import type { Metadata } from "next";
import { obtenerSesion } from "@/lib/auth/sesion";
import { PuntoDeVenta, type ProductoPOS } from "@/components/pos/PuntoDeVenta";
import type { ConfiguracionNegocio } from "@/lib/types/database";

export const metadata: Metadata = { title: "Punto de venta" };

export default async function PosPage() {
  const { supabase } = await obtenerSesion();

  const [{ data: productos }, { data: config }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, codigo, nombre, precio_unitario, stock, exento, presentacion, laboratorio")
      .eq("activo", true)
      .order("nombre"),
    supabase.from("configuracion_negocio").select("*").limit(1).maybeSingle(),
  ]);

  const iva = Number((config as ConfiguracionNegocio | null)?.porcentaje_iva ?? 16);

  return (
    <PuntoDeVenta
      productos={(productos ?? []) as ProductoPOS[]}
      porcentajeIva={iva}
    />
  );
}
