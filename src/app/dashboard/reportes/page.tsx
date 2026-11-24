import type { Metadata } from "next";
import { BarChart3, Download, FileText, Receipt, TrendingUp } from "lucide-react";
import { exigirAdmin } from "@/lib/auth/sesion";
import {
  formatoBs,
  formatoEntero,
  hoyCaracas,
  inicioDeMesCaracas,
  sumarDias,
} from "@/lib/formato";
import { GraficoVentas, type PuntoGrafico } from "@/components/reportes/GraficoVentas";
import { Insignia } from "@/components/ui/Insignia";
import type { ResumenPeriodo, TopProducto, VentaPorDia } from "@/lib/types/database";

export const metadata: Metadata = { title: "Reportes" };

interface Busqueda {
  desde?: string;
  hasta?: string;
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<Busqueda>;
}) {
  const { supabase } = await exigirAdmin();

  const params = await searchParams;
  const hoy = hoyCaracas();
  const desde = params.desde ?? inicioDeMesCaracas();
  const hasta = params.hasta ?? hoy;

  const [resumenRes, porDiaRes, topRes] = await Promise.all([
    supabase.rpc("resumen_periodo", { p_desde: desde, p_hasta: hasta }),
    supabase.from("ventas_por_dia").select("*").gte("dia", desde).lte("dia", hasta).order("dia"),
    supabase.rpc("top_productos", { p_desde: desde, p_hasta: hasta }),
  ]);

  const resumen = ((resumenRes.data?.[0] ?? {
    facturas: 0,
    base_imponible: 0,
    exento: 0,
    iva: 0,
    total: 0,
  }) as ResumenPeriodo);

  const filas = (porDiaRes.data ?? []) as VentaPorDia[];
  const porDia = new Map(filas.map((f) => [f.dia, f]));

  // Si el rango es razonable se rellenan los días sin ventas con cero.
  const diasRango =
    Math.round(
      (new Date(`${hasta}T00:00:00Z`).getTime() - new Date(`${desde}T00:00:00Z`).getTime()) /
        86_400_000,
    ) + 1;

  let serie: PuntoGrafico[];

  if (diasRango > 0 && diasRango <= 92) {
    serie = Array.from({ length: diasRango }, (_, i) => {
      const dia = sumarDias(desde, i);
      const fila = porDia.get(dia);
      return {
        etiqueta: dia.slice(8, 10),
        total: Number(fila?.total ?? 0),
        facturas: Number(fila?.facturas ?? 0),
      };
    });
  } else {
    serie = filas.map((f) => ({
      etiqueta: f.dia.slice(8, 10),
      total: Number(f.total),
      facturas: Number(f.facturas),
    }));
  }

  const top = (topRes.data ?? []) as TopProducto[];
  const hayError = Boolean(resumenRes.error || porDiaRes.error || topRes.error);

  const tarjetas = [
    {
      etiqueta: "Total vendido",
      valor: formatoBs(Number(resumen.total)),
      nota: `${formatoEntero(Number(resumen.facturas))} facturas completadas`,
      icono: TrendingUp,
      clase: "bg-azul-suave text-azul",
    },
    {
      etiqueta: "Base imponible",
      valor: formatoBs(Number(resumen.base_imponible)),
      nota: `Exento (E): ${formatoBs(Number(resumen.exento))}`,
      icono: FileText,
      clase: "bg-ok-suave text-ok",
    },
    {
      etiqueta: "IVA recaudado",
      valor: formatoBs(Number(resumen.iva)),
      nota: "Solo ventas completadas",
      icono: Receipt,
      clase: "bg-fondo-2 text-titulo",
    },
    {
      etiqueta: "Promedio por factura",
      valor: formatoBs(
        Number(resumen.facturas) > 0 ? Number(resumen.total) / Number(resumen.facturas) : 0,
      ),
      nota: "Ticket promedio del período",
      icono: BarChart3,
      clase: "bg-alerta-suave text-alerta",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Filtro de fechas */}
      <section className="tarjeta p-4">
        <form action="/dashboard/reportes" method="get" className="flex flex-wrap items-end gap-2.5">
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
          <button type="submit" className="btn btn-primario h-10">
            Aplicar
          </button>

          <a
            href={`/api/reportes/ventas?desde=${desde}&hasta=${hasta}`}
            download
            className="btn btn-suave h-10"
          >
            <Download className="h-4 w-4" aria-hidden />
            Exportar CSV
          </a>
          <span className="ml-auto text-[11.5px] text-texto-3">
            Fechas calculadas en hora de Venezuela (America/Caracas)
          </span>
        </form>
      </section>

      {hayError && (
        <div className="rounded-[10px] border border-alerta-borde bg-alerta-suave px-4 py-3 text-[12.5px] text-alerta">
          No se pudieron leer todos los datos. Verifica que las funciones{" "}
          <span className="mono">resumen_periodo</span> y{" "}
          <span className="mono">top_productos</span> existan (004_modulo4.sql).
        </div>
      )}

      {/* Tarjetas */}
      <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map((t) => {
          const Icono = t.icono;
          return (
            <article key={t.etiqueta} className="tarjeta flex items-start gap-3.5 p-4">
              <span className={`grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[11px] ${t.clase}`}>
                <Icono className="h-[19px] w-[19px]" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold text-texto-3">{t.etiqueta}</p>
                <p className="num mt-0.5 text-[20px] font-extrabold tracking-tight">{t.valor}</p>
                <p className="mt-0.5 truncate text-[11px] text-texto-3">{t.nota}</p>
              </div>
            </article>
          );
        })}
      </section>

      {/* Gráfico */}
      <section className="tarjeta p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Ventas por día</h2>
            <p className="mt-0.5 text-[11.5px] text-texto-3">
              Del {desde} al {hasta} · las facturas anuladas no suman
            </p>
          </div>
          <Insignia tono="info">America/Caracas</Insignia>
        </div>

        {serie.length === 0 ? (
          <p className="py-16 text-center text-[13px] text-texto-3">
            No hay ventas registradas en este período.
          </p>
        ) : (
          <GraficoVentas datos={serie} />
        )}
      </section>

      {/* Top 5 */}
      <section className="tarjeta p-5">
        <div className="mb-4">
          <h2 className="text-[15px] font-bold tracking-tight">Top 5 productos más vendidos</h2>
          <p className="mt-0.5 text-[11.5px] text-texto-3">
            Por unidades vendidas en el período seleccionado
          </p>
        </div>

        {top.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-texto-3">
            Sin datos para el período.
          </p>
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Producto</th>
                  <th className="text-right">Unidades</th>
                  <th className="text-right">Monto vendido</th>
                </tr>
              </thead>
              <tbody>
                {top.map((p, i) => (
                  <tr key={`${p.producto_id ?? p.nombre}-${i}`}>
                    <td>
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-[7px] text-[11px] font-extrabold ${
                          i === 0 ? "bg-azul text-white" : "bg-fondo-2 text-texto-2"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="font-semibold text-texto">{p.nombre}</td>
                    <td className="num text-right">{formatoEntero(Number(p.unidades))}</td>
                    <td className="num text-right font-semibold">{formatoBs(Number(p.monto))}</td>
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
