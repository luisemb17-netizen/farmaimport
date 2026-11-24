"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, Loader2, ShieldCheck, UserPlus, UserRound, X } from "lucide-react";
import { crearUsuario } from "@/lib/actions/usuarios";
import type { Rol } from "@/lib/types/database";

const ROLES: Array<{ value: Rol; titulo: string; detalle: string; icono: typeof UserRound }> = [
  {
    value: "cajero",
    titulo: "Cajero",
    detalle: "Punto de venta, cobranza y sus propias facturas. No puede anular ni tocar el inventario.",
    icono: UserRound,
  },
  {
    value: "administrador",
    titulo: "Administrador",
    detalle: "Acceso total: inventario, usuarios, reportes, configuración y anulación de facturas.",
    icono: ShieldCheck,
  },
];

export function BotonNuevoUsuario() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [cedula, setCedula] = useState("");
  const [clave, setClave] = useState("");
  const [rol, setRol] = useState<Rol>("cajero");

  function limpiar() {
    setNombre("");
    setCorreo("");
    setCedula("");
    setClave("");
    setRol("cajero");
    setError(null);
  }

  async function guardar() {
    setError(null);
    setEnviando(true);

    const resultado = await crearUsuario({
      nombre_completo: nombre,
      email: correo,
      password: clave,
      cedula,
      rol,
    });

    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.mensaje);
      return;
    }

    toast.success(resultado.mensaje);
    limpiar();
    setAbierto(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className="btn btn-primario">
        <UserPlus className="h-4 w-4" aria-hidden />
        Nuevo usuario
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-negro/55 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-nuevo-usuario"
            className="w-full max-w-lg rounded-[14px] border border-borde bg-superficie p-6 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.6)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="titulo-nuevo-usuario" className="text-[16px] font-bold tracking-tight">
                  Nuevo usuario
                </h2>
                <p className="mt-1 text-[12px] text-texto-2">
                  La cuenta queda confirmada: puede entrar de inmediato con la clave que le pongas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  limpiar();
                }}
                className="rounded p-1 text-texto-3 hover:text-texto"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-[9px] border border-peligro-borde bg-peligro-suave px-3 py-2 text-[12px] text-peligro">
                {error}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="etiqueta" htmlFor="nuevo-nombre">
                  Nombre completo
                </label>
                <input
                  id="nuevo-nombre"
                  className="campo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="María García"
                  autoFocus
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="etiqueta" htmlFor="nuevo-correo">
                    Correo
                  </label>
                  <input
                    id="nuevo-correo"
                    type="email"
                    className="campo"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="cajero@farmaimport.com"
                  />
                </div>
                <div>
                  <label className="etiqueta" htmlFor="nuevo-cedula">
                    Cédula
                  </label>
                  <input
                    id="nuevo-cedula"
                    className="campo mono"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value.toUpperCase())}
                    placeholder="V-12345678"
                  />
                </div>
              </div>

              <div>
                <label className="etiqueta" htmlFor="nuevo-clave">
                  Contraseña
                </label>
                <input
                  id="nuevo-clave"
                  type="text"
                  className="campo"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <p className="mt-1 text-[11px] text-texto-3">
                  Se muestra para que puedas dictársela al empleado. Puede cambiarla luego desde su perfil.
                </p>
              </div>

              <div>
                <p className="etiqueta">Rol</p>
                <div className="flex flex-col gap-2">
                  {ROLES.map((r) => {
                    const Icono = r.icono;
                    const activo = rol === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRol(r.value)}
                        aria-pressed={activo}
                        className={`flex items-start gap-3 rounded-[10px] border p-3 text-left transition ${
                          activo
                            ? "border-azul bg-azul-suave"
                            : "border-borde hover:border-borde-fuerte"
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[8px] ${
                            activo ? "bg-azul text-white" : "bg-fondo-2 text-texto-2"
                          }`}
                        >
                          <Icono className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-[12.5px] font-bold">
                            {r.titulo}
                            {activo && <Check className="h-3.5 w-3.5 text-azul" aria-hidden />}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-texto-2">
                            {r.detalle}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  limpiar();
                }}
                className="btn btn-suave"
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void guardar()}
                className="btn btn-primario"
                disabled={enviando || nombre.trim().length < 3 || correo.trim().length < 5 || clave.length < 6}
              >
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <UserPlus className="h-4 w-4" aria-hidden />
                )}
                Crear usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
