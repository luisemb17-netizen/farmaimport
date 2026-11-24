import type { Metadata } from "next";
import { MarcoAuth } from "@/components/auth/MarcoAuth";
import { FormularioLogin } from "./FormularioLogin";

export const metadata: Metadata = {
  title: "Iniciar sesión · FarmaImport",
  description: "Acceso al sistema de facturación digital de FarmaImport, C.A.",
};

export default function LoginPage() {
  return (
    <MarcoAuth>
      <FormularioLogin />
    </MarcoAuth>
  );
}
