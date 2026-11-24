"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Eye, EyeOff, Info, Loader2, Lock, Mail } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validaciones/auth";
import { iniciarSesion } from "@/lib/actions/auth";

export function FormularioLogin() {
  const router = useRouter();
  const [verClave, setVerClave] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function enviar(datos: LoginInput) {
    setErrorServidor(null);

    const resultado = await iniciarSesion(datos);

    if (!resultado.ok) {
      setErrorServidor(resultado.mensaje);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-[25px] font-bold tracking-tight">Iniciar sesión</h1>
      <p className="mb-6 mt-1.5 text-[13.5px] text-texto-3">
        Introduce tus credenciales para acceder al sistema.
      </p>

      <div className="mb-5 flex items-center gap-2.5 rounded-[10px] border border-azul-borde bg-azul-suave px-3.5 py-2.5 text-[12.5px] text-azul-oscuro">
        <Info className="h-4 w-4 shrink-0" aria-hidden />
        <span>Proyecto académico sin validez fiscal.</span>
      </div>

      {errorServidor && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-[10px] border border-peligro-borde bg-peligro-suave px-3.5 py-2.5 text-[12.5px] text-peligro"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{errorServidor}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(enviar)} noValidate>
        <label className="etiqueta" htmlFor="email">
          Correo electrónico
        </label>
        <div className="mb-1 flex items-center gap-2.5 rounded-campo border border-borde bg-superficie px-3 transition focus-within:border-azul focus-within:ring-4 focus-within:ring-azul/10">
          <Mail className="h-[17px] w-[17px] shrink-0 text-texto-3" aria-hidden />
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="admin@farmaimport.com"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-texto outline-none placeholder:text-texto-3"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="mb-2 text-[11.5px] font-medium text-peligro">
            {errors.email.message}
          </p>
        )}

        <label className="etiqueta mt-4" htmlFor="password">
          Contraseña
        </label>
        <div className="mb-1 flex items-center gap-2.5 rounded-campo border border-borde bg-superficie px-3 transition focus-within:border-azul focus-within:ring-4 focus-within:ring-azul/10">
          <Lock className="h-[17px] w-[17px] shrink-0 text-texto-3" aria-hidden />
          <input
            id="password"
            type={verClave ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-texto outline-none placeholder:text-texto-3"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            className="shrink-0 text-texto-3 transition hover:text-texto"
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {verClave ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
          </button>
        </div>
        {errors.password && (
          <p className="mb-2 text-[11.5px] font-medium text-peligro">
            {errors.password.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primario mt-6 w-full py-3 text-sm"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <>
              Entrar al panel
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[11.5px] text-texto-3">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-azul hover:underline">
          Regístrate
        </Link>
      </p>

      <p className="mt-3 text-center text-[11px] text-texto-3">
        Sistema de Facturación Digital · <b className="text-texto-2">Bs.</b> · America/Caracas
      </p>
    </div>
  );
}

