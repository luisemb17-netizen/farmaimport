export function AvisoConfiguracion() {
  return (
    <div className="grid min-h-screen place-items-center bg-fondo p-6">
      <div className="tarjeta max-w-2xl p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-azul">
          Falta configuración
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Conecta Supabase para arrancar
        </h1>
        <p className="mt-3 text-sm text-texto-2">
          El sistema guarda todo en Supabase (base de datos, login y RLS). Mientras
          no exista el proyecto, no hay nada que mostrar.
        </p>

        <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-[13px] text-texto-2">
          <li>
            Crea el proyecto en{" "}
            <span className="font-semibold text-azul">supabase.com</span> (plan gratuito).
          </li>
          <li>
            Ejecuta en el SQL Editor, en orden:{" "}
            <span className="mono">001_modulo1.sql</span>,{" "}
            <span className="mono">002_modulo2.sql</span>,{" "}
            <span className="mono">003_modulo3.sql</span>,{" "}
            <span className="mono">004_modulo4.sql</span> y{" "}
            <span className="mono">seed.sql</span>.
          </li>
          <li>
            Copia <span className="mono">.env.example</span> a{" "}
            <span className="mono">.env.local</span> y pega tu URL y tu publishable key.
          </li>
          <li>
            Reinicia el servidor con <span className="mono">npm run dev</span>.
          </li>
        </ol>

        <pre className="mt-4 overflow-auto rounded-[10px] border border-borde bg-fondo p-4 text-[12.5px] text-texto-2">
{`NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx`}
        </pre>

        <p className="mt-4 rounded-[10px] border border-azul-borde bg-azul-suave px-3.5 py-2.5 text-[12px] text-azul-oscuro">
          Guía completa paso a paso: <span className="mono">docs/GUIA-SUPABASE.md</span>{" "}
          (incluye cómo crear la cuenta de administrador).
        </p>

        <p className="mt-3 text-[11.5px] text-texto-3">
          Los valores están en Supabase → Project Settings → API Keys.
        </p>
      </div>
    </div>
  );
}
