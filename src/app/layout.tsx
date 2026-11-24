import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProveedorToasts } from "@/components/ui/ProveedorToasts";
import { RegistroSW } from "@/components/layout/RegistroSW";

export const metadata: Metadata = {
  title: {
    default: "FarmaImport, C.A. · Facturación Digital",
    template: "%s · FarmaImport",
  },
  description:
    "Sistema de facturación digital con simulación SENIAT para FarmaImport, C.A. Proyecto académico sin validez fiscal.",
  applicationName: "FarmaImport",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

/**
 * Aplica el tema guardado ANTES del primer pintado para evitar el destello
 * blanco al entrar en modo oscuro.
 */
const SCRIPT_TEMA = `(function(){try{if(localStorage.getItem('farmaimport-tema')==='oscuro'){document.documentElement.setAttribute('data-tema','oscuro');}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        {children}
        <ProveedorToasts />
        <RegistroSW />
      </body>
    </html>
  );
}
