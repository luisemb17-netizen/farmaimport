import type { Metadata } from "next";
import { MarcoAuth } from "@/components/auth/MarcoAuth";
import { FormularioRegistro } from "./FormularioRegistro";

export const metadata: Metadata = {
  title: "Crear cuenta · FarmaImport",
  description: "Registro de usuarios del sistema de facturación de FarmaImport, C.A.",
};

export default function RegistroPage() {
  return (
    <MarcoAuth>
      <FormularioRegistro />
    </MarcoAuth>
  );
}
