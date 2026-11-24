import type { ReactNode } from "react";

type Tono = "ok" | "info" | "alerta" | "peligro" | "neutro";

export function Insignia({
  tono = "neutro",
  children,
}: {
  tono?: Tono;
  children: ReactNode;
}) {
  return <span className={`insignia insignia-${tono}`}>{children}</span>;
}
