import { STAGE_CONFIG, type LeadStage } from "@/lib/stages";

/** Un solo color distingue que algo es un filtro (S6). */
const FILTER_COLOR = "#fe2c55";
/** Azul del ejemplo: la palabra que atrapa el comentario. */
const KEYWORD_COLOR = "#60a5fa";

interface FilterExample {
  id: string;
  /** Lo que escribe un cliente en el chat. */
  text: string;
  /** La palabra que el filtro atrapa dentro de esa frase. */
  keyword: string;
  stage: LeadStage;
}

/** Ejemplos por categoría: el usuario ve qué atrapa cada filtro y a qué embudo va. */
const FILTER_EXAMPLES: FilterExample[] = [
  { id: "ps5", text: "¿tienes la PS5?", keyword: "PS5", stage: "compra" },
  { id: "cartera", text: "cuánto cuesta la cartera", keyword: "cartera", stage: "negociando" },
  { id: "mochila", text: "quiero la mochila negra", keyword: "mochila", stage: "compra" },
  { id: "shalom", text: "envías por shalom?", keyword: "shalom", stage: "negociando" },
];

const primaryButton = {
  background: "linear-gradient(135deg, #fe2c55, #e8254a)",
  boxShadow: "0 8px 32px rgba(254,44,85,0.3)",
} as const;

/** Parte la frase en tres tramos para subrayar la palabra clave. */
function splitExample(example: FilterExample): { before: string; keyword: string; after: string } {
  const index = example.text.toLowerCase().indexOf(example.keyword.toLowerCase());
  if (index < 0) return { before: example.text, keyword: "", after: "" };
  return {
    before: example.text.slice(0, index),
    keyword: example.text.slice(index, index + example.keyword.length),
    after: example.text.slice(index + example.keyword.length),
  };
}

/** Paso 3: qué categorías de filtros hay y qué atrapa cada uno. No escribe nada. */
export function PresetsStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-extrabold text-white/90 tracking-tight">Agrega tus productos</h2>
        <p className="mt-2 text-sm text-white/40 max-w-sm mx-auto">
          Cada vez que alguien nombre uno de tus productos en el chat, ese comentario se clasifica
          como comprador. Los ajustas cuando quieras desde Filtros.
        </p>
      </div>

      {/* Categorías del embudo: dónde cae cada comentario que coincide. */}
      <section className="mb-6" aria-labelledby="onb-stages">
        <header className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-white/35" id="onb-stages">
            Categorías
          </span>
        </header>
        <ul className="flex flex-wrap gap-2">
          {(["compra", "negociando", "interesado"] as LeadStage[]).map((stage) => (
            <li
              key={stage}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STAGE_CONFIG[stage].color }} />
              <span className="text-sm font-semibold text-white/85">{STAGE_CONFIG[stage].label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Ejemplos: la palabra que atrapa, subrayada, y la categoría a la derecha. */}
      <section aria-labelledby="onb-examples">
        <header className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-white/35" id="onb-examples">
            Ejemplos
          </span>
          <span className="text-[10px] text-white/25">así atrapa un filtro</span>
        </header>
        <ul className="space-y-2">
          {FILTER_EXAMPLES.map((example) => {
            const { before, keyword, after } = splitExample(example);
            return (
              <li
                key={example.id}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: FILTER_COLOR }} />
                <span className="grow min-w-0 text-sm text-white/70 truncate">
                  «{before}
                  <span
                    style={{
                      color: KEYWORD_COLOR,
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                      fontWeight: 600,
                    }}
                  >
                    {keyword}
                  </span>
                  {after}»
                </span>
                <span
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold shrink-0"
                  style={{
                    backgroundColor: `${STAGE_CONFIG[example.stage].color}18`,
                    color: STAGE_CONFIG[example.stage].color,
                  }}
                >
                  {STAGE_CONFIG[example.stage].label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <button
        type="button"
        onClick={onContinue}
        className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-6"
        style={primaryButton}
      >
        Continuar
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
