import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  FileText,
  Package,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { obtenerSesion } from "@/lib/auth/sesion";
import { STOCK_BAJO } from "@/lib/constants";
import { formatoBs, formatoEntero, hoyCaracas, sumarDias } from "@/lib/formato";
import { Insignia } from "@/components/ui/Insignia";
import type { TopProducto, Venta, VentaPorDia } from "@/lib/types/database";

export const metadata: Metadata = { title: "Panel de control" };

interface DiaSerie {
  dia: string;
  etiqueta: string;
  total: number;
  facturas: number;
}

export default async function DashboardPage() {
  const { supabase } = await obtenerSesion();

  const hoy = hoyCaracas();
  const desde = sumarDias(hoy, -6);

  const [porDiaRes, ultimasRes, stockRes, topRes] = await Promise.all([
    supabase.from("ventas_por_dia").select("*").gte("dia", desde).order("dia"),
    supabase.from("ventas").select("*").order("created_at", { ascending: false }).limit(6),
    supabase
      .from("productos")
      .select("id", { count: "exact", head: true })
      .eq("activo", true)
      .lte("stock", STOCK_BAJO),
    supabase.rpc("top_productos", { p_desde: desde, p_hasta: hoy }),
  ]);

  // Si todavía no se ejecutaron las migraciones, se avisa en vez de romper.
  if (porDiaRes.error) {
    return (
      <div className="tarjeta mx-auto max-w-2xl p-8">
        <div className="flex items-center gap-2 text-peligro">
          <AlertCircle className="h-5 w-5" aria-hidden />
          <h2 className="text-lg font-bold">La base de datos no está lista</h2>
        </div>
        <p className="mt-2 text-[13px] text-texto-2">
          Ejecuta en orden los archivos <span className="mono">001_modulo1.sql</span> a{" "}
          <span className="mono">004_modulo4.sql</span> y luego{" "}
          <span className="mono">seed.sql</span> en el SQL Editor de Supabase.
        </p>
        <pre className="mono mt-4 overflow-auto rounded-[10px] border border-borde bg-fondo p-3 text-[11.5px] text-texto-2">
          {porDiaRes.error.message}
        </pre>
      </div>
    );
  }

  const filas = (porDiaRes.data ?? []) as VentaPorDia[];
  const porDia = new Map(filas.map((f) => [f.dia, f]));

  // Serie de 7 días, rellenando con ceros los días sin ventas.
  const serie: DiaSerie[] = Array.from({ length: 7 }, (_, i) => {
    const dia = sumarDias(desde, i);
    const fila = porDia.get(dia);
    return {
      dia,
      etiqueta: dia.slice(8, 10),
      total: Number(fila?.total ?? 0),
      facturas: Number(fila?.facturas ?? 0),
    };
  });

  const hoyFila = porDia.get(hoy);
  const totalHoy = Number(hoyFila?.total ?? 0);
  const facturasHoy = Number(hoyFila?.facturas ?? 0);
  const baseHoy = Number(hoyFila?.base_imponible ?? 0);
  const ivaHoy = Number(hoyFila?.iva ?? 0);
  const exentoHoy = Number(hoyFila?.exento ?? 0);

  const stockBajo = stockRes.count ?? 0;
  const top = (topRes.data ?? []) as TopProducto[];
  const ultimas = (ultimasRes.data ?? []) as Venta[];

  const maxSerie = Math.max(...serie.map((s) => s.total), 1);

  const stats = [
    {
      etiqueta: "Ventas de hoy",
      valor: formatoBs(totalHoy),
      nota: `${formatoEntero(facturasHoy)} factura${facturasHoy === 1 ? "" : "s"} emitida${facturasHoy === 1 ? "" : "s"}`,
      icono: TrendingUp,
      clase: "bg-azul-suave text-azul",
    },
    {
      etiqueta: "Base imponible hoy",
      valor: formatoBs(baseHoy),
      nota: `Exento (E): ${formatoBs(exentoHoy)}`,
      icono: FileText,
      clase: "bg-ok-suave text-ok",
    },
    {
      etiqueta: "IVA recaudado hoy",
      valor: formatoBs(ivaHoy),
      nota: "Alícuota configurada (16%)",
      icono: Receipt,
      clase: "bg-fondo-2 text-titulo",
    },
    {
      etiqueta: "Stock bajo",
      valor: formatoEntero(stockBajo),
      nota: `Productos con ≤ ${STOCK_BAJO} unidades`,
      icono: AlertTriangle,
      clase: "bg-alerta-suave text-alerta",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ---------- Métricas ---------- */}
      <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icono = s.icono;
          return (
            <article key={s.etiqueta} className="tarjeta flex items-start gap-3.5 p-4">
              <span className={`grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[11px] ${s.clase}`}>
                <Icono className="h-[19px] w-[19px]" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold text-texto-3">{s.etiqueta}</p>
                <p className="num mt-0.5 text-[21px] font-extrabold tracking-tight">
                  {s.valor}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-texto-3">{s.nota}</p>
              </div>
            </article>
          );
        })}
      </section>

      {/* ---------- Gráfico + Top 5 ---------- */}
      <section className="grid gap-3.5 lg:grid-cols-[1.55fr_1fr]">
        <article className="tarjeta p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-bold tracking-tight">Ventas de los últimos 7 días</h2>
              <p className="mt-0.5 text-[11.5px] text-texto-3">Total facturado en bolívares</p>
            </div>
            <Insignia tono="info">7 días</Insignia>
          </div>

          <div className="flex h-[190px] items-end gap-2.5 pt-2">
            {serie.map((d) => {
              const alto = Math.max(4, Math.round((d.total / maxSerie) * 100));
              return (
                <div key={d.dia} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full max-w-[38px] rounded-t-[7px] bg-gradient-to-b from-[#60a5fa] to-azul transition hover:brightness-110"
                    style={{ height: `${alto}%` }}
                    title={`${d.etiqueta}: ${formatoBs(d.total)}`}
                  />
                  <small className="text-[10.5px] font-semibold text-texto-3">{d.etiqueta}</small>
                </div>
              );
            })}
          </div>
        </article>

        <article className="tarjeta p-5">
          <div className="mb-4">
            <h2 className="text-[15px] font-bold tracking-tight">Top 5 productos</h2>
            <p className="mt-0.5 text-[11.5px] text-texto-3">Por unidades vendidas (7 días)</p>
          </div>

          {top.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-texto-3">
              Todavía no hay ventas registradas.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {top.map((p, i) => (
                <div key={`${p.producto_id ?? p.nombre}-${i}`} className="flex items-center gap-2.5">
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-[7px] text-[11px] font-extrabold ${
                      i === 0 ? "bg-azul text-white" : "bg-fondo-2 text-texto-2"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{p.nombre}</p>
                    <p className="text-[10.5px] text-texto-3">
                      {formatoEntero(Number(p.unidades))} unidades
                    </p>
                  </div>
                  <span className="num shrink-0 text-[12px] font-bold">
                    {formatoBs(Number(p.monto))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {/* ---------- Últimas facturas ---------- */}
      <section className="tarjeta p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Últimas facturas</h2>
            <p className="mt-0.5 text-[11.5px] text-texto-3">Movimientos recientes</p>
          </div>
          <Link href="/dashboard/ventas" className="btn btn-suave">
            Ver todas
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {ultimas.length === 0 ? (
          <div className="py-10 text-center">
            <Package className="mx-auto h-8 w-8 text-texto-3" aria-hidden />
            <p className="mt-2 text-[13px] font-semibold">Aún no hay facturas</p>
            <p className="text-[12px] text-texto-3">
              Registra la primera venta desde el punto de venta.
            </p>
            <Link href="/dashboard/pos" className="btn btn-primario mx-auto mt-4">
              Ir al punto de venta
            </Link>
          </div>
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Control</th>
                  <th>Cliente</th>
                  <th>Método</th>
                  <th className="text-right">Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ultimas.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link
                        href={`/dashboard/ventas/${v.id}/factura`}
                        className="mono font-semibold text-azul hover:underline"
                      >
                        {v.numero_factura}
                      </Link>
                    </td>
                    <td className="mono text-texto-3">{v.numero_control}</td>
                    <td className="max-w-[220px] truncate">{v.cliente_nombre}</td>
                    <td className="capitalize">{v.metodo_pago.replaceAll("_", " ")}</td>
                    <td className="num text-right font-semibold text-texto">
                      {formatoBs(Number(v.total))}
                    </td>
                    <td>
                      <Insignia tono={v.estado === "anulada" ? "peligro" : "ok"}>
                        {v.estado === "anulada" ? "Anulada" : "Completada"}
                      </Insignia>
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
