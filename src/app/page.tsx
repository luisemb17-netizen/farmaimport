import { redirect } from "next/navigation";

/**
 * La raíz no muestra nada: el proxy ya redirige a /login si no hay sesión.
 * Si hay sesión, entramos directo al panel.
 */
export default function Home() {
  redirect("/dashboard");
}
