import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft, Package, Pencil } from "lucide-react";
import { obtenerSesion } from "@/lib/auth/sesion";
import { STOCK_BAJO } from "@/lib/constants";
import { formatoBs, formatoEntero, formatoFechaHora } from "@/lib/formato";
import { Insignia } from "@/components/ui/Insignia";
import type { ProductoConCategoria } from "@/lib/types/database";

export const metadata: Metadata = { title: "Detalle del producto" };

export default async function DetalleProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, perfil } = await obtenerSesion();
  const esAdmin = perfil?.rol === "administrador";

  const { data } = await supabase
    .from("productos")
    .select("*, categorias(id, nombre)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const producto = data as ProductoConCategoria;
  const bajo = producto.stock <= STOCK_BAJO;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/dashboard/productos"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-texto-3 hover:text-azul"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Volver a productos
        </Link>

        {esAdmin && (
          <Link href={`/dashboard/productos/${producto.id}/editar`} className="btn btn-primario">
            <Pencil className="h-4 w-4" aria-hidden />
            Editar
          </Link>
        )}
      </div>

      <section className="tarjeta flex flex-col gap-5 p-5 sm:flex-row">
        <div className="grid h-[132px] w-[132px] shrink-0 place-items-center overflow-hidden rounded-[12px] border border-borde bg-fondo">
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              width={132}
              height={132}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-8 w-8 text-texto-3" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[19px] font-bold tracking-tight">{producto.nombre}</h2>
            <Insignia tono={producto.activo ? "ok" : "neutro"}>
              {producto.activo ? "Activo" : "Inactivo"}
            </Insignia>
            {producto.exento && <Insignia tono="info">(E) Exento</Insignia>}
            {bajo && (
              <Insignia tono={producto.stock === 0 ? "peligro" : "alerta"}>
                {producto.stock === 0 ? "Agotado" : "Stock bajo"}
              </Insignia>
            )}
          </div>

          <p className="mono mt-1 text-[12px] text-texto-3">{producto.codigo}</p>

          {producto.descripcion && (
            <p className="mt-2 text-[13px] text-texto-2">{producto.descripcion}</p>
          )}

          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-wide text-texto-3">
                Precio
              </dt>
              <dd className="num text-[15px] font-bold">{formatoBs(Number(producto.precio_unitario))}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-wide text-texto-3">
                Stock
              </dt>
              <dd className={`num text-[15px] font-bold ${bajo ? "text-peligro" : ""}`}>
                {formatoEntero(producto.stock)}
              </dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-wide text-texto-3">
                Categoría
              </dt>
              <dd className="text-[13px] font-semibold">
                {producto.categorias?.nombre ?? "Sin categoría"}
              </dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-wide text-texto-3">
                Laboratorio
              </dt>
              <dd className="text-[13px] font-semibold">{producto.laboratorio ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-wide text-texto-3">
                Presentación
              </dt>
              <dd className="text-[13px] font-semibold">{producto.presentacion ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-wide text-texto-3">
                Actualizado
              </dt>
              <dd className="text-[12px] text-texto-2">{formatoFechaHora(producto.updated_at)}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
