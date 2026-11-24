"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin, obtenerSesion } from "@/lib/auth/sesion";
import { clienteSchema } from "@/lib/validaciones/cliente";
import { anulacionSchema } from "@/lib/validaciones/configuracion";
import { METODOS_PAGO } from "@/lib/constants";
import type { ActionResult, Cliente, MetodoPago } from "@/lib/types/database";

/** Busca un cliente por cédula o RIF (normalizado en mayúsculas). */
export async function buscarCliente(
  rifCedula: string,
): Promise<ActionResult<Cliente | null>> {
  const { supabase } = await obtenerSesion();

  const rif = rifCedula.trim().toUpperCase();
  if (rif.length < 3) {
    return { ok: false, mensaje: "Escribe una cédula o RIF válido." };
  }

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("rif_cedula", rif)
    .maybeSingle();

  if (error) return { ok: false, mensaje: error.message };

  return {
    ok: true,
    mensaje: data ? "Cliente encontrado." : "Cliente no registrado.",
    data: (data as Cliente | null) ?? null,
  };
}

/** Crea un cliente nuevo desde el POS. */
export async function crearCliente(datos: unknown): Promise<ActionResult<Cliente>> {
  const { supabase } = await obtenerSesion();

  const validacion = clienteSchema.safeParse(datos);
  if (!validacion.success) {
    return {
      ok: false,
      mensaje: validacion.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const d = validacion.data;
  const rif = d.rif_cedula.toUpperCase();

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nombre: d.nombre,
      rif_cedula: rif,
      direccion: d.direccion?.trim() || null,
      telefono: d.telefono?.trim() || null,
      email: d.email?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, mensaje: `Ya existe un cliente con la cédula/RIF ${rif}.` };
    }
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/dashboard/pos");
  return { ok: true, mensaje: "Cliente registrado.", data: data as Cliente };
}

export interface EntradaVenta {
  clienteId: string;
  metodoPago: MetodoPago;
  items: { producto_id: string; cantidad: number }[];
  observaciones?: string;
}

/**
 * Registra la venta llamando a la función SQL registrar_venta().
 * El navegador solo envía producto_id y cantidad: los precios, el IVA y los
 * totales los calcula la base de datos.
 */
export async function registrarVenta(
  entrada: EntradaVenta,
): Promise<ActionResult<{ ventaId: string }>> {
  const { supabase } = await obtenerSesion();

  if (!entrada.clienteId) {
    return { ok: false, mensaje: "Selecciona un cliente antes de cobrar." };
  }

  if (!METODOS_PAGO.some((m) => m.value === entrada.metodoPago)) {
    return { ok: false, mensaje: "Método de pago inválido." };
  }

  const items = (entrada.items ?? []).filter(
    (i) => i.producto_id && Number.isInteger(i.cantidad) && i.cantidad > 0,
  );

  if (items.length === 0) {
    return { ok: false, mensaje: "El carrito está vacío." };
  }

  const { data, error } = await supabase.rpc("registrar_venta", {
    p_cliente_id: entrada.clienteId,
    p_metodo_pago: entrada.metodoPago,
    p_items: items,
    p_observaciones: entrada.observaciones?.trim() || null,
  });

  if (error) {
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ventas");
  revalidatePath("/dashboard/productos");

  return {
    ok: true,
    mensaje: "Venta registrada correctamente.",
    data: { ventaId: String(data) },
  };
}

/** Anula una factura (solo administrador). Cambia el estado y devuelve el stock. */
export async function anularVenta(
  ventaId: string,
  motivo: string,
): Promise<ActionResult> {
  const { supabase } = await exigirAdmin();

  const validacion = anulacionSchema.safeParse({ motivo });
  if (!validacion.success) {
    return {
      ok: false,
      mensaje: validacion.error.issues[0]?.message ?? "Indica el motivo.",
    };
  }

  const { error } = await supabase.rpc("anular_venta", {
    p_venta_id: ventaId,
    p_motivo: validacion.data.motivo,
  });

  if (error) {
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ventas");
  revalidatePath(`/dashboard/ventas/${ventaId}`);
  revalidatePath(`/dashboard/ventas/${ventaId}/factura`);
  revalidatePath("/dashboard/reportes");
  revalidatePath("/dashboard/productos");

  return { ok: true, mensaje: "Factura anulada y stock devuelto." };
}
