// ============================================================================
// Tipos de la base de datos (FarmaImport, C.A.)
// Equivalente manual de: npx supabase gen types typescript --project-id <id>
// Si cambias una tabla, actualiza este archivo.
// ============================================================================

export type Rol = "administrador" | "cajero";
export type MetodoPago = "efectivo" | "transferencia" | "pago_movil" | "punto_de_venta";
export type EstadoVenta = "completada" | "anulada";

export interface Perfil {
  id: string;
  nombre_completo: string;
  email: string | null;
  cedula: string | null;
  rol: Rol;
  activo: boolean;
  created_at: string;
}

export interface ConfiguracionNegocio {
  id: string;
  razon_social: string;
  rif: string;
  direccion_fiscal: string;
  telefono: string | null;
  logo_url: string | null;
  porcentaje_iva: number;
  secuencia_factura: number;
  secuencia_control: number;
  updated_at: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  laboratorio: string | null;
  presentacion: string | null;
  precio_unitario: number;
  stock: number;
  categoria_id: string | null;
  imagen_url: string | null;
  activo: boolean;
  exento: boolean;
  created_at: string;
  updated_at: string;
}

/** Producto con la categoría resuelta (para listas y POS). */
export interface ProductoConCategoria extends Producto {
  categorias: Pick<Categoria, "id" | "nombre"> | null;
}

export interface Cliente {
  id: string;
  nombre: string;
  rif_cedula: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  created_at: string;
}

export interface Venta {
  id: string;
  numero_factura: string;
  numero_control: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_rif: string;
  cliente_direccion: string | null;
  vendedor_id: string;
  subtotal: number;
  monto_exento: number;
  porcentaje_iva: number;
  monto_iva: number;
  total: number;
  metodo_pago: MetodoPago;
  estado: EstadoVenta;
  observaciones: string | null;
  anulada_por: string | null;
  anulada_at: string | null;
  motivo_anulacion: string | null;
  created_at: string;
}

export interface DetalleVenta {
  id: string;
  venta_id: string;
  producto_id: string | null;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  exento: boolean;
  created_at: string;
  /** Código del producto (se une solo para mostrarlo en la factura). */
  productos?: { codigo: string } | null;
}

/** Venta con su detalle y los datos del vendedor (vista de factura). */
export interface VentaConDetalle extends Venta {
  detalle_ventas: DetalleVenta[];
  vendedor: Pick<Perfil, "nombre_completo"> | null;
}

export interface VentaPorDia {
  dia: string;
  facturas: number;
  base_imponible: number;
  exento: number;
  iva: number;
  total: number;
}

export interface TopProducto {
  producto_id: string | null;
  nombre: string;
  unidades: number;
  monto: number;
}

export interface ResumenPeriodo {
  facturas: number;
  base_imponible: number;
  exento: number;
  iva: number;
  total: number;
}

/** Resultado de una Server Action: estado + mensaje para el usuario. */
export type ActionResult<T = undefined> =
  | { ok: true; mensaje: string; data?: T }
  | { ok: false; mensaje: string };
