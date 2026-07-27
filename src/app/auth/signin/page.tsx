"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0b0f1a" }}>
      <div className="max-w-sm w-full mx-auto px-6">
        {/* Logo */}
        <a href="/" className="flex items-center justify-center gap-2.5 mb-12">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold shadow-lg"
            style={{
              background: "linear-gradient(135deg, #fe2c55, #25f4ee)",
              color: "#0b0f1a",
            }}
          >
            LL
          </div>
          <span className="text-lg font-bold text-white/80 tracking-tight">
            Live Leads
          </span>
        </a>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h1 className="text-xl font-extrabold text-white/90 text-center mb-2">
            Iniciar sesión
          </h1>
          <p className="text-sm text-white/40 text-center mb-8">
            Ingresa con tu cuenta de Google para usar Live Leads
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400 text-center">
                {error === "AccessDenied"
                  ? "Acceso denegado. No tienes permiso para ingresar."
                  : "Ocurrió un error al iniciar sesión. Intenta de nuevo."}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #fe2c55, #e8254a)",
              boxShadow: "0 8px 32px rgba(254,44,85,0.3)",
              color: "white",
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          <p className="mt-6 text-xs text-white/20 text-center">
            Al ingresar aceptas usar Live Leads para capturar leads de tus TikTok Lives.
          </p>
        </div>

        <p className="mt-8 text-center">
          <a
            href="/"
            className="text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            ← Volver al inicio
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0b0f1a" }}>
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
