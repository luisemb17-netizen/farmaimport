import type { Metadata } from "next";
import { Tags } from "lucide-react";
import { exigirAdmin } from "@/lib/auth/sesion";
import { formatoEntero } from "@/lib/formato";
import { FormularioCategoria } from "@/components/categorias/FormularioCategoria";
import { BotonEliminarCategoria } from "@/components/categorias/BotonEliminarCategoria";

export const metadata: Metadata = { title: "Categorías" };

interface CategoriaConConteo {
  id: string;
  nombre: string;
  descripcion: string | null;
  productos: { count: number }[];
}

export default async function CategoriasPage() {
  const { supabase } = await exigirAdmin();

  const { data } = await supabase
    .from("categorias")
    .select("*, productos(count)")
    .order("nombre");

  const categorias = (data ?? []) as CategoriaConConteo[];

  return (
    <div className="flex flex-col gap-4">
      <section className="tarjeta p-5">
        <h2 className="mb-1 text-[15px] font-bold tracking-tight">Nueva categoría</h2>
        <p className="mb-4 text-[11.5px] text-texto-3">
          Agrupa los productos para encontrarlos más rápido en el POS.
        </p>
        <FormularioCategoria />
      </section>

      <section className="tarjeta p-4">
        <div className="mb-3">
          <h2 className="text-[15px] font-bold tracking-tight">Categorías</h2>
          <p className="mt-0.5 text-[11.5px] text-texto-3">
            {formatoEntero(categorias.length)} categoría{categorias.length === 1 ? "" : "s"}
          </p>
        </div>

        {categorias.length === 0 ? (
          <div className="py-12 text-center">
            <Tags className="mx-auto h-8 w-8 text-texto-3" aria-hidden />
            <p className="mt-2 text-[13px] font-semibold">Todavía no hay categorías</p>
            <p className="text-[12px] text-texto-3">Crea la primera con el formulario de arriba.</p>
          </div>
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th className="text-right">Productos</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold text-texto">{c.nombre}</td>
                    <td>{c.descripcion ?? <span className="text-texto-3">—</span>}</td>
                    <td className="num text-right">{formatoEntero(c.productos?.[0]?.count ?? 0)}</td>
                    <td>
                      <div className="flex justify-end">
                        <BotonEliminarCategoria id={c.id} nombre={c.nombre} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
