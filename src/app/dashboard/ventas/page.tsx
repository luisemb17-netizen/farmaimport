import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, FileText, Receipt, Search } from "lucide-react";
import { obtenerSesion } from "@/lib/auth/sesion";
import { VENTAS_POR_PAGINA } from "@/lib/constants";
import { formatoBs, formatoEntero, formatoFechaHora, hoyCaracas, sumarDias } from "@/lib/formato";
import { Insignia } from "@/components/ui/Insignia";
import type { EstadoVenta } from "@/lib/types/database";

export const metadata: Metadata = { title: "Ventas" };

interface Busqueda {
  desde?: string;
  hasta?: string;
  estado?: string;
  vendedor?: string;
  pagina?: string;
}

interface VentaFila {
  id: string;
  numero_factura: string;
  numero_control: string;
  cliente_nombre: string;
  metodo_pago: string;
  total: number;
  estado: EstadoVenta;
  created_at: string;
  vendedor_id: string;
  vendedor: { nombre_completo: string } | null;
}

/**
 * Venezuela es UTC-4 todo el año (no tiene horario de verano), así que la
 * medianoche de Caracas equivale a las 04:00 UTC de ese mismo día.
 */
function inicioDiaUTC(fecha: string): string {
  return `${fecha}T04:00:00.000Z`;
}

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<Busqueda>;
}) {
  const { supabase, perfil, user } = await obtenerSesion();
  const esAdmin = perfil?.rol === "administrador";

  const params = await searchParams;
  const hoy = hoyCaracas();
  const desde = params.desde ?? sumarDias(hoy, -29);
  const hasta = params.hasta ?? hoy;
  const estado = params.estado ?? "";
  const vendedor = params.vendedor ?? "";
  const pagina = Math.max(1, Number(params.pagina) || 1);
  const offset = (pagina - 1) * VENTAS_POR_PAGINA;

  let consulta = supabase
    .from("ventas")
    .select("*, vendedor:perfiles!ventas_vendedor_id_fkey(nombre_completo)", { count: "exact" })
    .gte("created_at", inicioDiaUTC(desde))
    .lt("created_at", inicioDiaUTC(sumarDias(hasta, 1)))
    .order("created_at", { ascending: false });

  if (estado === "completada" || estado === "anulada") {
    consulta = consulta.eq("estado", estado);
  }
  if (esAdmin && vendedor) {
    consulta = consulta.eq("vendedor_id", vendedor);
  }

  const [{ data: ventas, count }, { data: cajeros }] = await Promise.all([
    consulta.range(offset, offset + VENTAS_POR_PAGINA - 1),
    esAdmin
      ? supabase
          .from("perfiles")
          .select("id, nombre_completo")
          .eq("rol", "cajero")
          .order("nombre_completo")
      : Promise.resolve({ data: [] as { id: string; nombre_completo: string }[] }),
  ]);

  const filas = (ventas ?? []) as VentaFila[];
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / VENTAS_POR_PAGINA));
  const listaCajeros = (cajeros ?? []) as { id: string; nombre_completo: string }[];

  const sumaPagina = filas
    .filter((v) => v.estado === "completada")
    .reduce((acc, v) => acc + Number(v.total), 0);

  function urlPagina(nueva: number): string {
    const sp = new URLSearchParams({ desde, hasta });
    if (estado) sp.set("estado", estado);
    if (vendedor) sp.set("vendedor", vendedor);
    if (nueva > 1) sp.set("pagina", String(nueva));
    return `/dashboard/ventas?${sp.toString()}`;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---------- Filtros ---------- */}
      <section className="tarjeta p-4">
        <form action="/dashboard/ventas" method="get" className="flex flex-wrap items-end gap-2.5">
          <div>
            <label className="etiqueta" htmlFor="desde">
              Desde
            </label>
            <input
              id="desde"
              type="date"
              name="desde"
              defaultValue={desde}
              className="campo h-10 py-0 text-[13px]"
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="hasta">
              Hasta
            </label>
            <input
              id="hasta"
              type="date"
              name="hasta"
              defaultValue={hasta}
              className="campo h-10 py-0 text-[13px]"
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="estado">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={estado}
              className="campo h-10 w-auto py-0 text-[13px]"
            >
              <option value="">Todas</option>
              <option value="completada">Completadas</option>
              <option value="anulada">Anuladas</option>
            </select>
          </div>

          {esAdmin && listaCajeros.length > 0 && (
            <div>
              <label className="etiqueta" htmlFor="vendedor">
                Cajero
              </label>
              <select
                id="vendedor"
                name="vendedor"
                defaultValue={vendedor}
                className="campo h-10 w-auto py-0 text-[13px]"
              >
                <option value="">Todos</option>
                {listaCajeros.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primario h-10">
            <Search className="h-4 w-4" aria-hidden />
            Filtrar
          </button>

          <Link href="/dashboard/ventas" className="btn btn-ghost h-10">
            Limpiar
          </Link>

          <a
            href={`/api/reportes/ventas?desde=${desde}&hasta=${hasta}&estado=${estado}&vendedor=${vendedor}`}
            download
            className="btn btn-suave h-10"
          >
            <Download className="h-4 w-4" aria-hidden />
            Exportar CSV
          </a>
        </form>
      </section>

      {/* ---------- Tabla ---------- */}
      <section className="tarjeta p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Facturas emitidas</h2>
            <p className="mt-0.5 text-[11.5px] text-texto-3">
              {formatoEntero(total)} factura{total === 1 ? "" : "s"} · esta página suma{" "}
              <b className="text-texto-2">{formatoBs(sumaPagina)}</b>
            </p>
          </div>
          <Link href="/dashboard/pos" className="btn btn-suave">
            Ir al POS
          </Link>
        </div>

        {filas.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="mx-auto h-8 w-8 text-texto-3" aria-hidden />
            <p className="mt-2 text-[13px] font-semibold">No hay ventas en este rango</p>
            <p className="text-[12px] text-texto-3">Cambia las fechas o registra una venta nueva.</p>
          </div>
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Fecha y hora</th>
                  <th>Cliente</th>
                  {esAdmin && <th>Vendedor</th>}
                  <th>Método</th>
                  <th className="text-right">Total</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link
                        href={`/dashboard/ventas/${v.id}`}
                        className="mono font-semibold text-azul hover:underline"
                      >
                        {v.numero_factura}
                      </Link>
                      <span className="mono block text-[10.5px] text-texto-3">
                        {v.numero_control}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-[12px]">{formatoFechaHora(v.created_at)}</td>
                    <td className="max-w-[200px] truncate">{v.cliente_nombre}</td>
                    {esAdmin && (
                      <td className="max-w-[160px] truncate text-[12px]">
                        {v.vendedor?.nombre_completo ?? "—"}
                      </td>
                    )}
                    <td className="capitalize">{v.metodo_pago.replaceAll("_", " ")}</td>
                    <td className="num text-right font-semibold text-texto">
                      {formatoBs(Number(v.total))}
                    </td>
                    <td>
                      <Insignia tono={v.estado === "anulada" ? "peligro" : "ok"}>
                        {v.estado === "anulada" ? "Anulada" : "Completada"}
                      </Insignia>
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <Link
                          href={`/dashboard/ventas/${v.id}/factura`}
                          className="btn btn-suave px-2.5 py-1.5"
                          title="Ver factura"
                        >
                          <FileText className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-texto-3">
              Página {pagina} de {totalPaginas}
            </p>
            <div className="flex items-center gap-1.5">
              <Link
                href={urlPagina(Math.max(1, pagina - 1))}
                className={`btn btn-suave ${pagina === 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Anterior
              </Link>
              <Link
                href={urlPagina(Math.min(totalPaginas, pagina + 1))}
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

      {!esAdmin && (
        <p className="text-[11.5px] text-texto-3">
          Como cajero solo ves las facturas que emitiste tú. Sesión: {user.email}
        </p>
      )}
    </div>
  );
}
