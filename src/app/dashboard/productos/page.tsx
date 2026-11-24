import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { obtenerSesion } from "@/lib/auth/sesion";
import { PRODUCTOS_POR_PAGINA, STOCK_BAJO } from "@/lib/constants";
import { formatoBs, formatoEntero } from "@/lib/formato";
import { Insignia } from "@/components/ui/Insignia";
import { AccionesProducto } from "@/components/productos/AccionesProducto";
import type { Categoria, ProductoConCategoria } from "@/lib/types/database";

export const metadata: Metadata = { title: "Productos" };

interface Busqueda {
  q?: string;
  pagina?: string;
  categoria?: string;
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<Busqueda>;
}) {
  const { supabase, perfil } = await obtenerSesion();
  const esAdmin = perfil?.rol === "administrador";

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const categoriaId = params.categoria ?? "";
  const pagina = Math.max(1, Number(params.pagina) || 1);
  const desde = (pagina - 1) * PRODUCTOS_POR_PAGINA;

  // Se quitan caracteres que rompen la sintaxis de PostgREST en .or()
  const qSeguro = q.replace(/[,()%]/g, " ").trim();

  let consulta = supabase
    .from("productos")
    .select("*, categorias(id, nombre)", { count: "exact" })
    .order("nombre", { ascending: true });

  if (qSeguro) {
    consulta = consulta.or(`nombre.ilike.%${qSeguro}%,codigo.ilike.%${qSeguro}%`);
  }
  if (categoriaId) {
    consulta = consulta.eq("categoria_id", categoriaId);
  }

  const [{ data: productos, count }, { data: categorias }] = await Promise.all([
    consulta.range(desde, desde + PRODUCTOS_POR_PAGINA - 1),
    supabase.from("categorias").select("*").order("nombre"),
  ]);

  const filas = (productos ?? []) as ProductoConCategoria[];
  const listaCategorias = (categorias ?? []) as Categoria[];
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA));

  function urlPagina(nueva: number): string {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (categoriaId) sp.set("categoria", categoriaId);
    if (nueva > 1) sp.set("pagina", String(nueva));
    const cadena = sp.toString();
    return cadena ? `/dashboard/productos?${cadena}` : "/dashboard/productos";
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---------- Barra de herramientas ---------- */}
      <section className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4">
        <form action="/dashboard/productos" method="get" className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-campo border border-borde bg-superficie px-3 focus-within:border-azul">
            <Search className="h-4 w-4 shrink-0 text-texto-3" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre o código…"
              className="h-10 w-56 bg-transparent text-[13px] outline-none placeholder:text-texto-3"
            />
          </div>

          <select
            name="categoria"
            defaultValue={categoriaId}
            className="campo h-10 w-auto py-0 text-[13px]"
          >
            <option value="">Todas las categorías</option>
            {listaCategorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          <button type="submit" className="btn btn-suave">
            Filtrar
          </button>
          {(q || categoriaId) && (
            <Link href="/dashboard/productos" className="btn btn-ghost">
              Limpiar
            </Link>
          )}
        </form>

        {esAdmin && (
          <Link href="/dashboard/productos/nuevo" className="btn btn-primario">
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo producto
          </Link>
        )}
      </section>

      {/* ---------- Tabla ---------- */}
      <section className="tarjeta p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Inventario</h2>
            <p className="mt-0.5 text-[11.5px] text-texto-3">
              {formatoEntero(total)} producto{total === 1 ? "" : "s"}
              {q ? ` para «${q}»` : ""}
            </p>
          </div>
        </div>

        {filas.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto h-8 w-8 text-texto-3" aria-hidden />
            <p className="mt-2 text-[13px] font-semibold">No hay productos</p>
            <p className="text-[12px] text-texto-3">
              {q || categoriaId
                ? "Prueba con otra búsqueda o limpia los filtros."
                : "Crea el primer producto del inventario."}
            </p>
          </div>
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Código</th>
                  <th>Categoría</th>
                  <th className="text-right">Precio</th>
                  <th className="text-right">Stock</th>
                  <th>IVA</th>
                  <th>Estado</th>
                  {esAdmin && <th className="text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filas.map((p) => {
                  const bajo = p.stock <= STOCK_BAJO;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          {p.imagen_url ? (
                            <Image
                              src={p.imagen_url}
                              alt=""
                              width={34}
                              height={34}
                              className="h-[34px] w-[34px] rounded-[8px] border border-borde object-cover"
                            />
                          ) : (
                            <span className="grid h-[34px] w-[34px] place-items-center rounded-[8px] bg-fondo-2 text-texto-3">
                              <Package className="h-4 w-4" aria-hidden />
                            </span>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/productos/${p.id}`}
                              className="block truncate text-[13px] font-semibold text-texto hover:text-azul"
                            >
                              {p.nombre}
                            </Link>
                            <span className="block truncate text-[11px] text-texto-3">
                              {[p.laboratorio, p.presentacion].filter(Boolean).join(" · ") || "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="mono">{p.codigo}</td>
                      <td>{p.categorias?.nombre ?? <span className="text-texto-3">—</span>}</td>
                      <td className="num text-right font-semibold text-texto">
                        {formatoBs(Number(p.precio_unitario))}
                      </td>
                      <td className="text-right">
                        <span
                          className={`num font-bold ${bajo ? "text-peligro" : "text-texto"}`}
                        >
                          {formatoEntero(p.stock)}
                        </span>
                        {bajo && (
                          <span className="ml-1.5 inline-block align-middle">
                            <Insignia tono={p.stock === 0 ? "peligro" : "alerta"}>
                              {p.stock === 0 ? "Agotado" : "Bajo"}
                            </Insignia>
                          </span>
                        )}
                      </td>
                      <td>
                        {p.exento ? (
                          <Insignia tono="info">(E) Exento</Insignia>
                        ) : (
                          <span className="text-texto-3">16%</span>
                        )}
                      </td>
                      <td>
                        <Insignia tono={p.activo ? "ok" : "neutro"}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </Insignia>
                      </td>
                      {esAdmin && (
                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/dashboard/productos/${p.id}/editar`}
                              className="btn btn-suave px-2.5 py-1.5"
                              title="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                            <AccionesProducto id={p.id} activo={p.activo} nombre={p.nombre} />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------- Paginación ---------- */}
        {totalPaginas > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-texto-3">
              Página {pagina} de {totalPaginas}
            </p>
            <div className="flex items-center gap-1.5">
              <Link
                href={urlPagina(Math.max(1, pagina - 1))}
                aria-disabled={pagina === 1}
                className={`btn btn-suave ${pagina === 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Anterior
              </Link>
              <Link
                href={urlPagina(Math.min(totalPaginas, pagina + 1))}
                aria-disabled={pagina === totalPaginas}
                className={`btn btn-suave ${
                  pagina === totalPaginas ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
