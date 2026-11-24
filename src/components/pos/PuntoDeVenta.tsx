"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Banknote,
  CreditCard,
  Landmark,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
} from "lucide-react";
import { calcularTotales, redondear2 } from "@/lib/calculos";
import { METODOS_PAGO, STOCK_BAJO } from "@/lib/constants";
import { formatoBs, formatoEntero } from "@/lib/formato";
import { registrarVenta } from "@/lib/actions/ventas";
import { EscanerCodigo } from "@/components/pos/EscanerCodigo";
import { SelectorCliente } from "@/components/pos/SelectorCliente";
import type { Cliente, MetodoPago, Producto } from "@/lib/types/database";

export type ProductoPOS = Pick<
  Producto,
  | "id"
  | "codigo"
  | "nombre"
  | "precio_unitario"
  | "stock"
  | "exento"
  | "presentacion"
  | "laboratorio"
>;

interface LineaCarrito {
  producto: ProductoPOS;
  cantidad: number;
}

const ICONOS_PAGO: Record<MetodoPago, typeof Banknote> = {
  efectivo: Banknote,
  transferencia: Landmark,
  pago_movil: Smartphone,
  punto_de_venta: CreditCard,
};

export function PuntoDeVenta({
  productos,
  porcentajeIva,
}: {
  productos: ProductoPOS[];
  porcentajeIva: number;
}) {
  const router = useRouter();

  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      if (p.stock <= 0) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.laboratorio ?? "").toLowerCase().includes(q)
      );
    });
  }, [productos, busqueda]);

  const totales = useMemo(
    () =>
      calcularTotales(
        carrito.map((l) => ({
          precio_unitario: Number(l.producto.precio_unitario),
          cantidad: l.cantidad,
          exento: l.producto.exento,
        })),
        porcentajeIva,
      ),
    [carrito, porcentajeIva],
  );

  const unidades = carrito.reduce((total, l) => total + l.cantidad, 0);

  function enCarrito(id: string): number {
    return carrito.find((l) => l.producto.id === id)?.cantidad ?? 0;
  }

  function agregar(producto: ProductoPOS) {
    const actual = enCarrito(producto.id);

    if (actual >= producto.stock) {
      toast.error(`No hay más stock de ${producto.nombre} (${producto.stock} disponibles).`);
      return;
    }

    setCarrito((prev) => {
      const existe = prev.find((l) => l.producto.id === producto.id);
      if (existe) {
        return prev.map((l) =>
          l.producto.id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l,
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(id: string, delta: number) {
    setCarrito((prev) =>
      prev
        .map((l) => {
          if (l.producto.id !== id) return l;
          const nueva = l.cantidad + delta;
          if (nueva > l.producto.stock) {
            toast.error(`Stock máximo: ${l.producto.stock}.`);
            return l;
          }
          return { ...l, cantidad: nueva };
        })
        .filter((l) => l.cantidad > 0),
    );
  }

  function quitar(id: string) {
    setCarrito((prev) => prev.filter((l) => l.producto.id !== id));
  }

  async function cobrar() {
    if (!cliente) {
      toast.error("Selecciona o registra un cliente antes de cobrar.");
      return;
    }
    if (carrito.length === 0) {
      toast.error("El carrito está vacío.");
      return;
    }

    setEnviando(true);
    const resultado = await registrarVenta({
      clienteId: cliente.id,
      metodoPago,
      items: carrito.map((l) => ({
        producto_id: l.producto.id,
        cantidad: l.cantidad,
      })),
      observaciones,
    });
    setEnviando(false);

    if (!resultado.ok) {
      toast.error(resultado.mensaje);
      return;
    }

    // Aviso de stock vacío: productos que se quedaron en 0 con esta venta.
    const recienAgotados = carrito.filter((l) => l.producto.stock - l.cantidad <= 0);

    toast.success("Venta registrada. Generando factura…");

    if (recienAgotados.length > 0) {
      toast(
        `Stock vacío: ${recienAgotados.map((l) => l.producto.nombre).join(", ")}`,
        { icon: "⚠️", duration: 6000 },
      );
    }

    setCarrito([]);
    setCliente(null);
    setObservaciones("");
    router.push(`/dashboard/ventas/${resultado.data?.ventaId}/factura`);
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[1.6fr_1fr]">
      {/* ================= Productos ================= */}
      <section className="flex flex-col gap-3">
        <div className="tarjeta flex items-center gap-2.5 p-3">
          <Search className="h-[18px] w-[18px] shrink-0 text-texto-3" aria-hidden />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, código o laboratorio…"
            className="h-9 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-texto-3"
          />
          <EscanerCodigo
            onDetectar={(codigo) => {
              const encontrado = productos.find(
                (p) => p.codigo.toLowerCase() === codigo.trim().toLowerCase(),
              );

              if (encontrado) {
                agregar(encontrado);
                toast.success(`${encontrado.nombre} agregado al carrito`);
              } else {
                setBusqueda(codigo);
                toast.error(`No hay ningún producto con el código ${codigo}`);
              }
            }}
          />

          <span className="shrink-0 rounded-full bg-fondo-2 px-2.5 py-1 text-[11px] font-bold text-texto-2">
            {formatoEntero(filtrados.length)}
          </span>
        </div>

        {filtrados.length === 0 ? (
          <div className="tarjeta py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-texto-3" aria-hidden />
            <p className="mt-2 text-[13px] font-semibold">Sin resultados</p>
            <p className="text-[12px] text-texto-3">
              No hay productos activos con stock que coincidan con la búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
            {filtrados.map((p) => {
              const usado = enCarrito(p.id);
              const disponible = p.stock - usado;
              const bajo = p.stock <= STOCK_BAJO;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => agregar(p)}
                  disabled={disponible <= 0}
                  className="tarjeta flex flex-col gap-2 p-3.5 text-left transition hover:border-azul-borde hover:shadow-[0_10px_26px_-20px_rgba(37,99,235,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-texto">{p.nombre}</p>
                      <p className="truncate text-[11px] text-texto-3">
                        {[p.laboratorio, p.presentacion].filter(Boolean).join(" · ") || p.codigo}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                        bajo ? "bg-alerta-suave text-alerta" : "bg-fondo-2 text-texto-2"
                      }`}
                    >
                      {formatoEntero(disponible)}
                    </span>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-2">
                    <span className="num text-[14px] font-extrabold text-texto">
                      {formatoBs(Number(p.precio_unitario))}
                    </span>
                    {p.exento ? (
                      <span className="rounded-full bg-azul-suave px-2 py-0.5 text-[10px] font-bold text-azul-oscuro">
                        (E) Exento
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-texto-3">IVA {porcentajeIva}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= Carrito ================= */}
      <aside className="tarjeta flex flex-col gap-3 p-4 xl:sticky xl:top-[86px]">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
            <ShoppingCart className="h-4 w-4 text-azul" aria-hidden />
            Carrito
          </h2>
          <span className="rounded-full bg-azul-suave px-2.5 py-1 text-[11px] font-bold text-azul-oscuro">
            {formatoEntero(unidades)} ítem{unidades === 1 ? "" : "s"}
          </span>
        </div>

        <SelectorCliente cliente={cliente} onCambiar={setCliente} />

        {/* Líneas */}
        <div className="max-h-[280px] overflow-y-auto">
          {carrito.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-texto-3">
              Agrega productos desde la izquierda.
            </p>
          ) : (
            carrito.map((l) => {
              const monto = redondear2(Number(l.producto.precio_unitario) * l.cantidad);
              return (
                <div
                  key={l.producto.id}
                  className="flex items-center gap-2 border-b border-borde py-2 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{l.producto.nombre}</p>
                    <p className="num text-[11px] text-texto-3">
                      {formatoBs(Number(l.producto.precio_unitario))} × {l.cantidad}
                      {l.producto.exento && " · (E)"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(l.producto.id, -1)}
                      className="grid h-6 w-6 place-items-center rounded border border-borde text-texto-2 hover:border-borde-fuerte hover:text-texto"
                      aria-label="Quitar una unidad"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="num w-6 text-center text-[12px] font-bold">{l.cantidad}</span>
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(l.producto.id, 1)}
                      className="grid h-6 w-6 place-items-center rounded border border-borde text-texto-2 hover:border-borde-fuerte hover:text-texto"
                      aria-label="Agregar una unidad"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <span className="num w-[74px] shrink-0 text-right text-[12px] font-bold">
                    {formatoBs(monto)}
                  </span>

                  <button
                    type="button"
                    onClick={() => quitar(l.producto.id)}
                    className="shrink-0 rounded p-1 text-texto-3 hover:text-peligro"
                    aria-label="Quitar del carrito"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Totales (vista previa; el monto real lo calcula la BD) */}
        <div className="rounded-[10px] bg-fondo p-3">
          <div className="flex justify-between py-0.5 text-[12px] text-texto-2">
            <span>Base imponible</span>
            <span className="num font-semibold text-texto">{formatoBs(totales.baseImponible)}</span>
          </div>
          <div className="flex justify-between py-0.5 text-[12px] text-texto-2">
            <span>Exento (E)</span>
            <span className="num font-semibold text-texto">{formatoBs(totales.exento)}</span>
          </div>
          <div className="flex justify-between py-0.5 text-[12px] text-texto-2">
            <span>IVA ({porcentajeIva}%)</span>
            <span className="num font-semibold text-texto">{formatoBs(totales.iva)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-borde pt-2">
            <span className="text-[12px] font-bold uppercase tracking-wide">Total a pagar</span>
            <span className="num text-[18px] font-extrabold text-titulo">
              {formatoBs(totales.total)}
            </span>
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-texto-3">
            Método de pago
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {METODOS_PAGO.map((m) => {
              const Icono = ICONOS_PAGO[m.value];
              const activo = metodoPago === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMetodoPago(m.value)}
                  aria-pressed={activo}
                  className={`flex items-center justify-center gap-1.5 rounded-[9px] border px-2 py-2 text-[11.5px] font-semibold transition ${
                    activo
                      ? "border-azul bg-azul-suave text-azul-oscuro"
                      : "border-borde text-texto-2 hover:border-borde-fuerte"
                  }`}
                >
                  <Icono className="h-3.5 w-3.5" aria-hidden />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          placeholder="Observaciones (opcional)"
          className="campo resize-none py-2 text-[12px]"
        />

        <button
          type="button"
          onClick={() => void cobrar()}
          disabled={enviando || carrito.length === 0}
          className="btn btn-primario w-full py-3 text-sm"
        >
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <>Cobrar {formatoBs(totales.total)}</>
          )}
        </button>
      </aside>
    </div>
  );
}

