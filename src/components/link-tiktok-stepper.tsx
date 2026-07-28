"use client";

import { useAuth } from "@clerk/astro/react";
import { useCallback, useState } from "react";

const TIKTOK_URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.-]+)/;
const TIKTOK_HANDLE_REGEX = /^@?([a-zA-Z0-9_.-]+)$/;

function extractUsername(raw: string): string | null {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(TIKTOK_URL_REGEX);
  if (urlMatch) return urlMatch[1];
  const handleMatch = trimmed.match(TIKTOK_HANDLE_REGEX);
  if (handleMatch) return handleMatch[1];
  return null;
}

const STEPS = [
  { label: "Autenticación", done: true },
  { label: "Tu TikTok", done: false },
];

export default function LinkTikTokStepper() {
  const { userId, isLoaded } = useAuth();
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const extracted = input.trim() ? extractUsername(input.trim()) : null;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!extracted || !userId) return;

      setSaving(true);
      setError("");

      try {
        const res = await fetch("/api/users/profile/tiktok", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: userId,
            tiktokUsername: extracted,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Error al guardar");
        }

        setSaved(true);
        // Redirect to /app after a brief pause
        setTimeout(() => {
          window.location.href = "/app";
        }, 800);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setSaving(false);
      }
    },
    [extracted, userId],
  );

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-0">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 mb-8 sm:mb-12">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step.done
                    ? "bg-[#fe2c55] text-white shadow-lg shadow-[#fe2c55]/30"
                    : "bg-white/5 text-white/40 border border-white/10"
                }`}
              >
                {step.done ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  step.done ? "text-white/60" : "text-white/30"
                }`}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-3 mb-7 rounded-full ${
                  step.done ? "bg-[#fe2c55]/50" : "bg-white/5"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {saved ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full bg-[#4ade80]/15 mx-auto flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white/80 mb-1">¡Listo!</h2>
          <p className="text-sm text-white/40">Redirigiendo al Live Controller...</p>
        </div>
      ) : (
        <>
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-extrabold text-white/90 tracking-tight">
              Conecta tu TikTok
            </h2>
            <p className="mt-2 text-sm text-white/40 max-w-xs mx-auto">
              Ingresa el enlace de tu perfil de TikTok para que podamos capturar tus leads automáticamente.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://www.tiktok.com/@tucuenta"
                className="w-full h-12 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/50 transition-all"
                disabled={saving}
                autoFocus
              />
              {input.trim() && extracted && (
                <p className="mt-1.5 text-[11px] text-white/20 font-mono px-1">
                  @{extracted}
                </p>
              )}
              {input.trim() && !extracted && (
                <p className="mt-1.5 text-[11px] text-[#fe2c55]/60 px-1">
                  Enlace no válido — debe ser tiktok.com/@usuario
                </p>
              )}
            </div>

            {error && (
              <p className="text-xs text-[#fe2c55] text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving || !extracted}
              className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              style={{
                background: "linear-gradient(135deg, #fe2c55, #e8254a)",
                boxShadow: "0 8px 32px rgba(254,44,85,0.3)",
              }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Continuar al Live Controller"
              )}
            </button>
          </form>

          {/* Removed: skip link — middleware redirects back anyway */}
        </>
      )}
    </div>
  );
}
