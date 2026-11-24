"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  IdCard,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { registroSchema, type RegistroInput } from "@/lib/validaciones/auth";
import { registrarse } from "@/lib/actions/auth";

const claseCaja =
  "mb-1 flex items-center gap-2.5 rounded-campo border border-borde bg-superficie px-3 transition focus-within:border-azul focus-within:ring-4 focus-within:ring-azul/10";
const claseInput =
  "h-11 min-w-0 flex-1 bg-transparent text-sm text-texto outline-none placeholder:text-texto-3";

export function FormularioRegistro() {
  const router = useRouter();
  const [verClave, setVerClave] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistroInput>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre_completo: "",
      cedula: "",
      email: "",
      password: "",
      confirmar: "",
    },
  });

  async function enviar(datos: RegistroInput) {
    setErrorServidor(null);
    setExito(null);

    const resultado = await registrarse(datos);

    if (!resultado.ok) {
      setErrorServidor(resultado.mensaje);
      return;
    }

    if (resultado.data?.requiereConfirmacion) {
      setExito(resultado.mensaje);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-[25px] font-bold tracking-tight">Crear cuenta</h1>
      <p className="mb-6 mt-1.5 text-[13.5px] text-texto-3">
        Regístrate para empezar a facturar. El perfil se crea automáticamente.
      </p>

      {errorServidor && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-[10px] border border-peligro-borde bg-peligro-suave px-3.5 py-2.5 text-[12.5px] text-peligro"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{errorServidor}</span>
        </div>
      )}

      {exito && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2.5 rounded-[10px] border border-ok-borde bg-ok-suave px-3.5 py-2.5 text-[12.5px] text-ok"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{exito}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(enviar)} noValidate>
        <label className="etiqueta" htmlFor="nombre_completo">
          Nombre completo
        </label>
        <div className={claseCaja}>
          <User className="h-[17px] w-[17px] shrink-0 text-texto-3" aria-hidden />
          <input
            id="nombre_completo"
            type="text"
            autoComplete="name"
            placeholder="María García"
            className={claseInput}
            {...register("nombre_completo")}
          />
        </div>
        {errors.nombre_completo && (
          <p className="mb-2 text-[11.5px] font-medium text-peligro">
            {errors.nombre_completo.message}
          </p>
        )}

        <label className="etiqueta mt-4" htmlFor="cedula">
          Cédula
        </label>
        <div className={claseCaja}>
          <IdCard className="h-[17px] w-[17px] shrink-0 text-texto-3" aria-hidden />
          <input
            id="cedula"
            type="text"
            placeholder="V-12345678"
            className={claseInput}
            {...register("cedula")}
          />
        </div>
        {errors.cedula && (
          <p className="mb-2 text-[11.5px] font-medium text-peligro">{errors.cedula.message}</p>
        )}

        <label className="etiqueta mt-4" htmlFor="email">
          Correo electrónico
        </label>
        <div className={claseCaja}>
          <Mail className="h-[17px] w-[17px] shrink-0 text-texto-3" aria-hidden />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="cajero@farmaimport.com"
            className={claseInput}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="mb-2 text-[11.5px] font-medium text-peligro">{errors.email.message}</p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="password">
              Contraseña
            </label>
            <div className={claseCaja}>
              <Lock className="h-[17px] w-[17px] shrink-0 text-texto-3" aria-hidden />
              <input
                id="password"
                type={verClave ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Mínimo 6"
                className={claseInput}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setVerClave((v) => !v)}
                className="shrink-0 text-texto-3 transition hover:text-texto"
                aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {verClave ? (
                  <EyeOff className="h-[17px] w-[17px]" />
                ) : (
                  <Eye className="h-[17px] w-[17px]" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mb-2 text-[11.5px] font-medium text-peligro">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="etiqueta" htmlFor="confirmar">
              Repetir contraseña
            </label>
            <div className={claseCaja}>
              <CreditCard className="h-[17px] w-[17px] shrink-0 text-texto-3" aria-hidden />
              <input
                id="confirmar"
                type={verClave ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repite la clave"
                className={claseInput}
                {...register("confirmar")}
              />
            </div>
            {errors.confirmar && (
              <p className="mb-2 text-[11.5px] font-medium text-peligro">
                {errors.confirmar.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primario mt-6 w-full py-3 text-sm"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <>
              Crear cuenta
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[11.5px] text-texto-3">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-azul hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

