"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatoBs } from "@/lib/formato";

const formatoEje = new Intl.NumberFormat("es-VE", { maximumFractionDigits: 0 });

export interface PuntoGrafico {
  etiqueta: string;
  total: number;
  facturas: number;
}

export function GraficoVentas({ datos }: { datos: PuntoGrafico[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e8f0" vertical={false} />
          <XAxis
            dataKey="etiqueta"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(valor) => formatoEje.format(Number(valor))}
          />
          <Tooltip
            cursor={{ fill: "rgba(37,99,235,0.06)" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e3e8f0",
              fontSize: 12,
              boxShadow: "0 18px 40px -28px rgba(15,23,42,0.55)",
            }}
            formatter={(valor) => [formatoBs(Number(valor)), "Total vendido"]}
            labelFormatter={(etiqueta) => `Día ${etiqueta}`}
          />
          <Bar dataKey="total" fill="#2563eb" radius={[7, 7, 3, 3]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
