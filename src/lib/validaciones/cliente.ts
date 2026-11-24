import { z } from "zod";
import { REGEX_RIF_CEDULA } from "@/lib/constants";

/** Cliente del POS (Módulo 3) */
export const clienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, { message: "Escribe el nombre o la razón social" })
    .max(120, { message: "Máximo 120 caracteres" }),
  rif_cedula: z
    .string()
    .trim()
    .regex(REGEX_RIF_CEDULA, {
      message: "Formato inválido. Ej: V-12345678 o J-12345678-9",
    }),
  direccion: z.string().trim().max(300, { message: "Máximo 300 caracteres" }).optional(),
  telefono: z.string().trim().max(20, { message: "Máximo 20 caracteres" }).optional(),
  email: z
    .union([z.email({ message: "Correo inválido" }), z.literal("")])
    .optional(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
