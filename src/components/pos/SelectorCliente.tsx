"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Search, UserPlus, UserRound, X } from "lucide-react";
import { buscarCliente, crearCliente } from "@/lib/actions/ventas";
import type { Cliente } from "@/lib/types/database";

export function SelectorCliente({
  cliente,
  onCambiar,
}: {
  cliente: Cliente | null;
  onCambiar: (cliente: Cliente | null) => void;
}) {
  const [rif, setRif] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [noEncontrado, setNoEncontrado] = useState(false);

  // Formulario de alta cuando la cédula/RIF no existe.
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [creando, setCreando] = useState(false);

  async function buscar() {
    if (!rif.trim()) {
      toast.error("Escribe la cédula o el RIF del cliente.");
      return;
    }

    setBuscando(true);
    const resultado = await buscarCliente(rif);
    setBuscando(false);

    if (!resultado.ok) {
      toast.error(resultado.mensaje);
      return;
    }

    if (resultado.data) {
      onCambiar(resultado.data);
      setNoEncontrado(false);
      toast.success("Cliente encontrado.");
    } else {
      setNoEncontrado(true);
      setNombre("");
      toast("Cliente no registrado. Complétalo para crearlo.", { icon: "👤" });
    }
  }

  async function crear() {
    if (!nombre.trim()) {
      toast.error("Escribe el nombre o la razón social.");
      return;
    }

    setCreando(true);
    const resultado = await crearCliente({
      nombre,
      rif_cedula: rif,
      direccion,
      telefono,
      email,
    });
    setCreando(false);

    if (!resultado.ok) {
      toast.error(resultado.mensaje);
      return;
    }

    toast.success("Cliente registrado.");
    onCambiar(resultado.data ?? null);
    setNoEncontrado(false);
    setNombre("");
    setDireccion("");
    setTelefono("");
    setEmail("");
  }

  /* ---------- Cliente ya seleccionado ---------- */
  if (cliente) {
    return (
      <div className="rounded-[10px] border border-azul-borde bg-azul-suave p-3">
        <div className="flex items-start gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-azul text-white">
            <UserRound className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-titulo">{cliente.nombre}</p>
            <p className="mono text-[11.5px] text-azul-oscuro">{cliente.rif_cedula}</p>
            {cliente.direccion && (
              <p className="mt-0.5 truncate text-[11px] text-texto-2">{cliente.direccion}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onCambiar(null)}
            className="shrink-0 rounded p-1 text-texto-3 transition hover:text-peligro"
            aria-label="Cambiar cliente"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Búsqueda ---------- */
  return (
    <div className="rounded-[10px] border border-borde p-3">
      <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-texto-3">
        Cliente
      </p>

      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-campo border border-borde px-2.5 focus-within:border-azul">
          <Search className="h-4 w-4 shrink-0 text-texto-3" aria-hidden />
          <input
            value={rif}
            onChange={(e) => setRif(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void buscar();
              }
            }}
            placeholder="V-12345678 / J-12345678-9"
            className="h-9 min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-texto-3"
          />
        </div>
        <button
          type="button"
          onClick={() => void buscar()}
          disabled={buscando}
          className="btn btn-primario px-3"
        >
          {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
        </button>
      </div>

      {noEncontrado && (
        <div className="mt-3 flex flex-col gap-2 border-t border-borde pt-3">
          <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-texto-2">
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Cliente nuevo: completa los datos
          </p>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre o razón social *"
            className="campo py-2 text-[12.5px]"
          />
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Dirección (opcional)"
            className="campo py-2 text-[12.5px]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Teléfono"
              className="campo py-2 text-[12.5px]"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo"
              className="campo py-2 text-[12.5px]"
            />
          </div>
          <button
            type="button"
            onClick={() => void crear()}
            disabled={creando}
            className="btn btn-suave mt-1"
          >
            {creando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <UserPlus className="h-4 w-4" aria-hidden />
            )}
            Registrar cliente
          </button>
        </div>
      )}
    </div>
  );
}

