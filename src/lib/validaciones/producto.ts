import { z } from "zod";

/** Producto de farmacia (Módulo 2) */
export const productoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, { message: "El código es obligatorio" })
    .max(20, { message: "Máximo 20 caracteres" })
    .regex(/^[A-Za-z0-9-]+$/, {
      message: "Solo letras, números y guiones (ej: ANL-001)",
    }),
  nombre: z
    .string()
    .trim()
    .min(3, { message: "El nombre es obligatorio" })
    .max(120, { message: "Máximo 120 caracteres" }),
  descripcion: z.string().trim().max(500, { message: "Máximo 500 caracteres" }).optional(),
  laboratorio: z.string().trim().max(80, { message: "Máximo 80 caracteres" }).optional(),
  presentacion: z.string().trim().max(80, { message: "Máximo 80 caracteres" }).optional(),
  precio_unitario: z
    .number({ message: "Escribe un precio válido" })
    .positive({ message: "El precio debe ser mayor que 0" })
    .max(9_999_999, { message: "El precio es demasiado alto" }),
  stock: z
    .number({ message: "Escribe un stock válido" })
    .int({ message: "El stock debe ser un número entero" })
    .min(0, { message: "El stock no puede ser negativo" })
    .max(1_000_000, { message: "El stock es demasiado alto" }),
  categoria_id: z.uuid().nullable().optional(),
  exento: z.boolean(),
  activo: z.boolean(),
  imagen_url: z.string().trim().optional(),
});

export type ProductoInput = z.infer<typeof productoSchema>;

/** Categoría */
export const categoriaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { message: "El nombre es obligatorio" })
    .max(60, { message: "Máximo 60 caracteres" }),
  descripcion: z.string().trim().max(200, { message: "Máximo 200 caracteres" }).optional(),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
