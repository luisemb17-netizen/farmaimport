import { z } from "zod";
import { REGEX_RIF_CEDULA } from "@/lib/constants";

/** Inicio de sesión */
export const loginSchema = z.object({
  email: z.email({ message: "Escribe un correo electrónico válido" }),
  password: z.string().min(1, { message: "La contraseña es obligatoria" }),
});

/** Registro de usuario: los metadatos crean la fila en perfiles */
export const registroSchema = z
  .object({
    nombre_completo: z
      .string()
      .trim()
      .min(3, { message: "Escribe tu nombre y apellido" })
      .max(80, { message: "Máximo 80 caracteres" }),
    cedula: z
      .string()
      .trim()
      .regex(REGEX_RIF_CEDULA, {
        message: "Formato inválido. Ej: V-12345678 o J-12345678-9",
      }),
    email: z.email({ message: "Escribe un correo electrónico válido" }),
    password: z
      .string()
      .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
      .max(72, { message: "Máximo 72 caracteres" }),
    confirmar: z.string(),
  })
  .refine((datos) => datos.password === datos.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

/** Edición del perfil propio (nunca el rol) */
export const perfilSchema = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(3, { message: "Escribe tu nombre y apellido" })
    .max(80),
  cedula: z
    .string()
    .trim()
    .regex(REGEX_RIF_CEDULA, { message: "Formato inválido. Ej: V-12345678" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type PerfilInput = z.infer<typeof perfilSchema>;
