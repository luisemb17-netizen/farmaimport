export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="tarjeta h-[104px] animate-pulse bg-fondo-2" />
        ))}
      </div>
      <div className="grid gap-3.5 lg:grid-cols-[1.55fr_1fr]">
        <div className="tarjeta h-[280px] animate-pulse bg-fondo-2" />
        <div className="tarjeta h-[280px] animate-pulse bg-fondo-2" />
      </div>
      <div className="tarjeta h-[240px] animate-pulse bg-fondo-2" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
