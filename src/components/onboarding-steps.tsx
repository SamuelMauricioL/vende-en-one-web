"use client";

import { useEffect, useState } from "react";
import {
  loadFilters,
  saveFilters,
  type KeywordCategory,
} from "@/lib/keyword-filters";
import { ONBOARDING_PRESETS } from "@/lib/onboarding-presets";

/** Ejemplos simples por categoría: lo que un cliente escribe sobre un producto. */
const PRESET_EXAMPLE: Record<string, string> = {
  "preset-compra": "«quiero 2 blusas de lino»",
  "preset-precio": "«cuánto cuesta la casaca negra»",
  "preset-talla": "«tienes talla M en la blusa?»",
  "preset-envio": "«envías a Trujillo?»",
};

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
          Elige tus filtros
        </h2>
        <p className="mt-2 text-sm text-white/40 max-w-sm mx-auto">
          Son palabras que tus clientes escriben en el live. Cuando alguien las
          dice, lo ordenamos solo y sabes a quién escribirle primero.
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
              style={{ background: preset.color }}
            />
            <span className="grow min-w-0">
              <span className="block text-sm font-semibold text-white/85">
                {preset.name}
              </span>
              <span className="block text-[11px] text-white/35 truncate">
                {PRESET_EXAMPLE[preset.id]}
              </span>
            </span>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-md shrink-0"
              style={{
                background: `${STAGE_COLOR[preset.stage]}1f`,
                color: STAGE_COLOR[preset.stage],
              }}
            >
              {STAGE_LABEL[preset.stage]}
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

      {/* Puedes agregar las palabras de tu producto y elegir su categoría */}
      <div
        className="rounded-xl px-4 py-3 mb-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p className="text-[11px] text-white/45 mb-2">
          También puedes agregar palabras de tu producto y elegir su categoría.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {["PS5", "vestido", "corset"].map((word) => (
            <span
              key={word}
              className="text-[11px] font-semibold px-2 py-1 rounded-md"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
            >
              {word}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-white/30">
          Si vendes PS5, «PS5» puede ser <b className="text-[#4ade80]">Interesado</b>. Si
          vendes ropa, «vestido» o «corset» también.
        </p>
      </div>

      {!accepted ? (
        <button
          type="button"
          onClick={useRecommended}
          className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={primaryButton}
        >
          Usar estos filtros
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
