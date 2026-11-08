"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { authHeaders } from "@/lib/api-auth";
import { resolveActiveStore } from "@/lib/active-store";
import { createFilter, discardFilters, fetchFilters, isStageFilter, type FilterView } from "@/lib/filters-api";
import { STAGE_CONFIG } from "@/lib/stages";
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

/** Paso 3: mismo modelo que la pantalla de Filtros: el sistema ya está activo y los tuyos se suman. */
export function PresetsStep({ onContinue }: { onContinue: () => void }) {
  const { getToken } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterView[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<string[]>(() => ONBOARDING_PRESETS.map((preset) => preset.name));

  // S1: los filtros son de la tienda activa; el sistema siempre viene en la lista.
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
        setFilters(list);
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

  const systemClassified = filters.filter((filter) => filter.source === "system").filter(isStageFilter);
  const discarded = discardFilters(filters);
  const ownNames = new Set(
    filters.filter((filter) => filter.source === "store").map((filter) => filter.name.trim().toLowerCase()),
  );

  const toggle = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  };

  // El servidor deduplica por nombre: reenviar un preset activo no duplica nada (S3).
  const handleContinue = async () => {
    if (saving) return;
    const pending = ONBOARDING_PRESETS.filter(
      (preset) => selected.includes(preset.name) && !ownNames.has(preset.name.trim().toLowerCase()),
    );
    if (storeId && pending.length > 0) {
      setSaving(true);
      setError("");
      try {
        for (const preset of pending) {
          await createFilter(
            storeId,
            { name: preset.name, keywords: preset.keywords, stage: preset.stage },
            getToken,
          );
        }
      } catch {
        setError("No pudimos guardar tus filtros. Intenta de nuevo.");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    onContinue();
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-extrabold text-white/90 tracking-tight">Tus filtros</h2>
        <p className="mt-2 text-sm text-white/40 max-w-sm mx-auto">
          Las palabras que atrapan a quien pregunta por tu producto: si un comentario coincide, se vuelve un lead.
          Los del sistema ya están activos y los tuyos se suman.
        </p>
      </div>

      {loading ? (
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 py-10">
          <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
          <span className="text-xs text-white/30">Cargando tus filtros...</span>
        </div>
      ) : (
        <>
          {/* Del sistema: siempre activos, no se editan. Mismo lenguaje que la pantalla de Filtros. */}
          {(systemClassified.length > 0 || discarded.length > 0) && (
            <section className="mb-5" aria-labelledby="onb-system">
              <header className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-white/35" id="onb-system">
                  Del sistema
                </span>
                <span className="text-[10px] font-mono tabular-nums text-white/20">
                  {systemClassified.length + discarded.length}
                </span>
                <span className="text-[10px] text-white/25">siempre activos</span>
              </header>
              <ul className="space-y-1">
                {systemClassified.map((filter) => (
                  <li
                    key={filter.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: FILTER_COLOR }} />
                    <span className="flex-1 text-sm font-semibold text-white/85 min-w-0 truncate">{filter.name}</span>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: STAGE_CONFIG[filter.stage].color }}>
                      {STAGE_CONFIG[filter.stage].label}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold shrink-0"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                      title="Filtro del sistema: no se puede editar"
                    >
                      Sistema
                    </span>
                  </li>
                ))}
                {discarded.map((filter) => (
                  <li
                    key={filter.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: FILTER_COLOR }} />
                    <span className="flex-1 text-sm font-semibold text-white/85 min-w-0 truncate">{filter.name}</span>
                    <span
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold shrink-0"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                      title="Filtro del sistema: no se puede editar"
                    >
                      Sistema
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold shrink-0"
                      style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
                      title="Estos mensajes se descartan: no se clasifican ni llegan a tus leads"
                    >
                      Descarta
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Tus filtros: los recomendados que se suman a los del sistema. */}
          <section aria-labelledby="onb-mine">
            <header className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-white/35" id="onb-mine">
                Tus filtros
              </span>
              <span className="text-[10px] text-white/25">toca para agregar o quitar</span>
            </header>
            <ul className="space-y-2">
              {ONBOARDING_PRESETS.map((preset) => {
                const already = ownNames.has(preset.name.trim().toLowerCase());
                const on = already || selected.includes(preset.name);
                return (
                  <li key={preset.id}>
                    <button
                      type="button"
                      onClick={() => (already ? undefined : toggle(preset.name))}
                      aria-pressed={on}
                      disabled={already}
                      className="w-full rounded-xl px-4 py-3 flex items-center gap-3 text-left transition-all duration-200 disabled:cursor-default"
                      style={{
                        background: on ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${on ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: FILTER_COLOR, opacity: on ? 1 : 0.3 }} />
                      <span className="grow min-w-0">
                        <span className="block text-sm font-semibold text-white/85">{preset.name}</span>
                        <span className="block text-[11px] text-white/35 truncate">{PRESET_EXAMPLE[preset.id]}</span>
                      </span>
                      <span className="text-[10px] font-semibold shrink-0" style={{ color: STAGE_CONFIG[preset.stage].color }}>
                        {STAGE_CONFIG[preset.stage].label}
                      </span>
                      <span
                        className="text-[10px] font-semibold shrink-0"
                        style={{ color: already ? "#4ade80" : on ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}
                      >
                        {already ? "Activo" : on ? "Agregar" : "Omitir"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {error && (
        <div role="alert" aria-live="polite" className="mt-3 text-center">
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

      <button
        type="button"
        onClick={() => void handleContinue()}
        disabled={loading || saving}
        aria-busy={saving}
        className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 mt-6"
        style={primaryButton}
      >
        {saving ? "Guardando..." : "Continuar"}
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
