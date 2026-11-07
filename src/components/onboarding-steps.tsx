"use client";

import { useEffect, useState } from "react";
import {
  loadFilters,
  saveFilters,
  type KeywordCategory,
} from "@/lib/keyword-filters";
import { ONBOARDING_PRESETS } from "@/lib/onboarding-presets";

const STAGE_LABEL: Record<KeywordCategory["stage"], string> = {
  compra: "Compra",
  negociando: "Negociando",
  interesado: "Interesado",
};

const STAGE_COLOR: Record<KeywordCategory["stage"], string> = {
  compra: "#fe2c55",
  negociando: "#facc15",
  interesado: "#4ade80",
};

const primaryButton = {
  background: "linear-gradient(135deg, #fe2c55, #e8254a)",
  boxShadow: "0 8px 32px rgba(254,44,85,0.3)",
} as const;

/** Paso 3: los filtros recomendados, con salida "Lo hago después". */
export function PresetsStep({ onContinue }: { onContinue: () => void }) {
  const [filters, setFilters] = useState<KeywordCategory[]>([]);

  useEffect(() => {
    setFilters(loadFilters());
  }, []);

  const accepted = filters.length > 0;

  const useRecommended = () => {
    const next = [...loadFilters(), ...ONBOARDING_PRESETS];
    saveFilters(next);
    setFilters(next);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-extrabold text-white/90 tracking-tight">
          Crea tus filtros
        </h2>
        <p className="mt-2 text-sm text-white/40 max-w-xs mx-auto">
          Los filtros son los grupos donde clasificamos a quienes comentan tu
          live. Empieza con los recomendados y cámbialos cuando quieras.
        </p>
      </div>

      {/* Ejemplo: así se ve un comentario clasificado */}
      <div
        className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span
          className="text-[11px] font-semibold px-2 py-1 rounded-md shrink-0"
          style={{ background: "rgba(37,244,238,0.14)", color: "#25f4ee" }}
        >
          Pregunta precio
        </span>
        <p className="text-xs text-white/50 truncate">
          <span className="text-white/80 font-semibold">rosa.ejemplo</span> · q.{" "}
          <span className="font-bold" style={{ color: "#25f4ee" }}>
            precio
          </span>{" "}
          de la casaca negra?
        </p>
      </div>

      {!accepted ? (
        <button
          type="button"
          onClick={useRecommended}
          className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={primaryButton}
        >
          ✨ Usar los recomendados
        </button>
      ) : (
        <div className="space-y-2 mb-5">
          {filters.map((f) => (
            <div
              key={f.id}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: f.color }}
              />
              <span className="grow min-w-0">
                <span className="block text-sm font-semibold text-white/85">
                  {f.name}
                </span>
                <span className="block text-[11px] text-white/30 truncate">
                  {f.keywords.join(", ")}
                </span>
              </span>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-md shrink-0"
                style={{
                  background: `${STAGE_COLOR[f.stage]}1f`,
                  color: STAGE_COLOR[f.stage],
                }}
              >
                {STAGE_LABEL[f.stage]}
              </span>
            </div>
          ))}
        </div>
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
