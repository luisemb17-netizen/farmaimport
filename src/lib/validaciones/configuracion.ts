import { z } from "zod";
import { REGEX_RIF } from "@/lib/constants";

/** Configuración fiscal del negocio (Módulo 1) */
export const configuracionSchema = z.object({
  razon_social: z
    .string()
    .trim()
    .min(3, { message: "La razón social es obligatoria" })
    .max(120, { message: "Máximo 120 caracteres" }),
  rif: z
    .string()
    .trim()
    .regex(REGEX_RIF, { message: "Formato de RIF inválido. Ej: J-12345678-9" }),
  direccion_fiscal: z
    .string()
    .trim()
    .min(5, { message: "La dirección fiscal es obligatoria" })
    .max(300, { message: "Máximo 300 caracteres" }),
  telefono: z.string().trim().max(20, { message: "Máximo 20 caracteres" }).optional(),
  porcentaje_iva: z
    .number({ message: "Escribe un porcentaje válido" })
    .min(0, { message: "El IVA no puede ser negativo" })
    .max(100, { message: "El IVA no puede superar 100%" }),
  logo_url: z.string().trim().optional(),
});

export type ConfiguracionInput = z.infer<typeof configuracionSchema>;

/** Anulación de factura (Módulo 4) */
export const anulacionSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(8, { message: "Explica el motivo (mínimo 8 caracteres)" })
    .max(300, { message: "Máximo 300 caracteres" }),
});

export type AnulacionInput = z.infer<typeof anulacionSchema>;
