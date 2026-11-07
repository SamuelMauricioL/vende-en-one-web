"use client";

import { useAuth } from "@clerk/astro/react";
import { authHeaders } from "@/lib/api-auth";
import { useCallback, useState } from "react";
import { FirstLiveStep, PresetsStep } from "@/components/onboarding-steps";

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

/**
 * Onboarding de primer uso: cuenta (Clerk) → TikTok → filtros → primer live.
 * El paso de correo del prototipo no existe acá porque la sesión es de Google.
 */type Phase = "tiktok" | "presets" | "live";

const STEPS = ["Tu cuenta", "Tu TikTok", "Tus filtros", "Primer live"];

const PHASE_INDEX: Record<Phase, number> = { tiktok: 1, presets: 2, live: 3 };

export default function OnboardingStepper() {
  const { userId, isLoaded, getToken } = useAuth();
  const [phase, setPhase] = useState<Phase>("tiktok");
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const extracted = input.trim() ? extractUsername(input.trim()) : null;
  const current = PHASE_INDEX[phase];

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!extracted || !userId) return;

      setSaving(true);
      setError("");

      try {
        const res = await fetch("/api/users/profile/tiktok", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await authHeaders(getToken)) },
          body: JSON.stringify({
            clerkUserId: userId,
            tiktokUsername: extracted,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Error al guardar");
        }

        setPhase("presets");
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
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  i < current
                    ? "bg-[#fe2c55] text-white shadow-lg shadow-[#fe2c55]/30"
                    : i === current
                      ? "bg-[#fe2c55]/15 text-[#fe2c55] border border-[#fe2c55]/40"
                      : "bg-white/5 text-white/40 border border-white/10"
                }`}
              >
                {i < current ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  i < current
                    ? "text-white/60"
                    : i === current
                      ? "text-white/80"
                      : "text-white/30"
                }`}
              >
                {label}
              </span>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`w-8 sm:w-14 h-0.5 mx-2 mb-7 rounded-full ${
                  i < current ? "bg-[#fe2c55]/50" : "bg-white/5"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {phase === "presets" ? (
        <PresetsStep onContinue={() => setPhase("live")} />
      ) : phase === "live" ? (
        <FirstLiveStep onStart={() => (window.location.href = "/app")} />
      ) : (
        <>
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-extrabold text-white/90 tracking-tight">
              Conecta tu TikTok
            </h2>
            <p className="mt-2 text-sm text-white/40 max-w-xs mx-auto">
              Ingresa el enlace de tu perfil de TikTok para que podamos capturar
              tus leads automáticamente.
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
                "Continuar"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
