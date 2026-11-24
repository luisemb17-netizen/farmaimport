import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { exigirAdmin } from "@/lib/auth/sesion";
import { FormularioProducto } from "@/components/productos/FormularioProducto";
import type { Categoria, Producto } from "@/lib/types/database";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await exigirAdmin();

  const [{ data: producto }, { data: categorias }] = await Promise.all([
    supabase.from("productos").select("*").eq("id", id).maybeSingle(),
    supabase.from("categorias").select("*").order("nombre"),
  ]);

  if (!producto) notFound();

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

      <FormularioProducto
        producto={producto as Producto}
        categorias={(categorias ?? []) as Categoria[]}
      />
    </div>
  );
}
