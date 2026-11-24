import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirAdmin } from "@/lib/auth/sesion";
import { FormularioProducto } from "@/components/productos/FormularioProducto";
import type { Categoria } from "@/lib/types/database";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NuevoProductoPage() {
  const { supabase } = await exigirAdmin();

  const { data } = await supabase.from("categorias").select("*").order("nombre");
  const categorias = (data ?? []) as Categoria[];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/dashboard/productos"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-texto-3 hover:text-azul"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Volver a productos
        </Link>
      </div>

      <FormularioProducto categorias={categorias} />
    </div>
  );
}
