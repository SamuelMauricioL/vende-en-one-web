"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { authHeaders } from "@/lib/api-auth";
import { resolveActiveStore } from "@/lib/active-store";
import { createFilter, fetchFilters } from "@/lib/filters-api";
import { ONBOARDING_PRESETS } from "@/lib/onboarding-presets";

/** S6: un solo color distingue que algo es un filtro. */
const FILTER_COLOR = "#fe2c55";

/** Ejemplos simples por categoría: lo que un cliente escribe sobre un producto. */
const PRESET_EXAMPLE: Record<string, string> = {
  "preset-compra": "«quiero 2 blusas de lino»",
  "preset-precio": "«cuánto cuesta la casaca negra»",
  "preset-talla": "«tienes talla M en la blusa?»",
  "preset-envio": "«envías a Trujillo?»",
};

const primaryButton = {
  background: "linear-gradient(135deg, #fe2c55, #e8254a)",
  boxShadow: "0 8px 32px rgba(254,44,85,0.3)",
} as const;

/** Paso 3: los filtros recomendados, con salida "Lo hago después". */
export function PresetsStep({ onContinue }: { onContinue: () => void }) {
  const { getToken } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // S1: los presets se guardan en la tienda activa del usuario.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/stores", { headers: await authHeaders(getToken) });
        if (!res.ok) throw new Error("stores");
        const data = (await res.json()) as { stores?: Array<{ _id: string; tiktokUsername: string }> };
        const store = resolveActiveStore(data.stores ?? []);
        if (cancelled) return;
        if (!store) {
          setError("No encontramos tu tienda activa.");
          return;
        }
        setStoreId(store._id);
        const list = await fetchFilters(store._id, getToken);
        if (cancelled) return;
        // Los `system` siempre existen: solo cuentan los filtros propios.
        setAccepted(list.some((filter) => filter.source === "store"));
      } catch {
        if (!cancelled) setError("No pudimos cargar tus filtros.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken, reloadKey]);

  // El servidor deduplica por nombre: repetir el clic no duplica nada (S3).
  const useRecommended = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    setError("");
    try {
      for (const preset of ONBOARDING_PRESETS) {
        await createFilter(
          storeId,
          { name: preset.name, keywords: preset.keywords, stage: preset.stage },
          getToken,
        );
      }
      setAccepted(true);
    } catch {
      setError("No pudimos guardar los filtros. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-extrabold text-white/90 tracking-tight">
          Elige tus filtros
        </h2>
        <p className="mt-2 text-sm text-white/40 max-w-sm mx-auto">
          Marca los que te sirvan en tu live. Puedes cambiarlos cuando quieras.
        </p>
      </div>

      {/* Un ejemplo por categoría, con productos que se venden en vivo */}
      <ul className="space-y-2 mb-5">
        {ONBOARDING_PRESETS.map((preset) => (
          <li
            key={preset.id}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: accepted ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${accepted ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: FILTER_COLOR }}
            />
            <span className="grow min-w-0">
              <span className="block text-sm font-semibold text-white/85">
                {preset.name}
              </span>
              <span className="block text-[11px] text-white/35 truncate">
                {PRESET_EXAMPLE[preset.id]}
              </span>
            </span>
            {accepted && (
              <svg
                className="w-4 h-4 shrink-0 text-[#4ade80]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </li>
        ))}
      </ul>

      {error && (
        <div role="alert" aria-live="polite" className="mb-3 text-center">
          <p className="text-[11px] text-[#fe2c55]">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-1 text-[11px] text-white/40 hover:text-white/70 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!accepted ? (
        <button
          type="button"
          onClick={() => void useRecommended()}
          disabled={loading || saving || !storeId}
          aria-busy={saving}
          className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
          style={primaryButton}
        >
          {saving ? "Guardando..." : "Usar estos filtros"}
        </button>
      ) : (
        <p className="text-[11px] text-[#4ade80] text-center">
          Listo: estos filtros ya están activos en tu cuenta.
        </p>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!accepted}
        className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 mt-4"
        style={primaryButton}
      >
        Continuar
      </button>

      <button
        type="button"
        onClick={onContinue}
        className="w-full mt-4 text-xs text-white/35 hover:text-white/60 transition-colors"
      >
        Lo hago después
      </button>
    </div>
  );
}

const FIRST_LIVE_STEPS = [
  "Abre tu live en TikTok, como siempre.",
  "Entra a Live Controller y presiona Iniciar live.",
  "Vende tranquilo: clasificamos los comentarios por ti.",
  "Al terminar, abre la Bandeja de rescate y escribe primero a quienes insistieron.",
];

/** Paso 4: qué va a pasar en su primer live, y salida a la app. */
export function FirstLiveStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <div
          className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(254,44,85,0.14)" }}
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fe2c55"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4.5v15l13-7.5-13-7.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-white/90 tracking-tight">
          Así haces tu primer live
        </h2>
      </div>

      <ol className="space-y-3 mb-5">
        {FIRST_LIVE_STEPS.map((text, i) => (
          <li
            key={text}
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ background: "rgba(254,44,85,0.15)", color: "#fe2c55" }}
            >
              {i + 1}
            </span>
            <span className="text-xs leading-relaxed text-white/60">
              {text}
            </span>
          </li>
        ))}
      </ol>

      {/* Prueba gratis: mismo mensaje que el prototipo */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6"
        style={{
          background: "rgba(254,44,85,0.08)",
          border: "1px solid rgba(254,44,85,0.25)",
        }}
      >
        <span className="text-lg leading-none">🎁</span>
        <span className="text-xs leading-relaxed text-white/70">
          Tienes <strong className="text-white">7 días gratis</strong> para
          probarlo todo.
        </span>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={primaryButton}
      >
        Empezar
      </button>
    </div>
  );
}
