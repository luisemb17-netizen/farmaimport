import type { Metadata } from "next";
import { AlertCircle, Hash } from "lucide-react";
import { exigirAdmin } from "@/lib/auth/sesion";
import { FormularioConfiguracion } from "@/components/configuracion/FormularioConfiguracion";
import type { ConfiguracionNegocio } from "@/lib/types/database";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const { supabase } = await exigirAdmin();

  const { data } = await supabase
    .from("configuracion_negocio")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (!data) {
    return (
      <div className="tarjeta mx-auto max-w-2xl p-8">
        <div className="flex items-center gap-2 text-peligro">
          <AlertCircle className="h-5 w-5" aria-hidden />
          <h2 className="text-lg font-bold">Falta la configuración del negocio</h2>
        </div>
        <p className="mt-2 text-[13px] text-texto-2">
          Ejecuta <span className="mono">001_modulo1.sql</span> en Supabase. Ese archivo crea
          la tabla y la única fila de configuración.
        </p>
      </div>
    );
  }

  const config = data as ConfiguracionNegocio;

  return (
    <div className="flex flex-col gap-4">
      <section className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[11px] bg-fondo-2 text-texto-2">
            <Hash className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-texto-3">
              Próximas secuencias
            </p>
            <p className="text-[13px] font-semibold">
              Factura{" "}
              <span className="mono">
                FAC-{String(config.secuencia_factura).padStart(6, "0")}
              </span>{" "}
              · Control{" "}
              <span className="mono">
                00-{String(config.secuencia_control).padStart(6, "0")}
              </span>
            </p>
          </div>
        </div>
        <p className="max-w-[320px] text-[11px] text-texto-3">
          Las secuencias las incrementa automáticamente la función{" "}
          <span className="mono">registrar_venta()</span> en cada venta.
        </p>
      </section>

      <FormularioConfiguracion config={config} />
    </div>
  );
}
