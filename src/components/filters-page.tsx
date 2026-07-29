"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  type KeywordCategory,
  loadFilters,
  saveFilters,
  generateId,
} from "@/lib/keyword-filters";
import type { LeadStage } from "@/lib/lead-classifier";

const PALETTE = [
  "#fe2c55", "#25f4ee", "#facc15", "#4ade80",
  "#7c3aed", "#f97316", "#06d6a0", "#f72585",
  "#3b82f6", "#e63946", "#8b5cf6", "#14b8a6",
];

function getColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

const STAGE_COLORS: Record<LeadStage, string> = {
  compra: "#fe2c55",
  negociando: "#facc15",
  interesado: "#4ade80",
};

const STAGE_LABELS: Record<LeadStage, string> = {
  compra: "Compra",
  negociando: "Negociando",
  interesado: "Interesado",
};

const STAGE_ORDER: LeadStage[] = ["compra", "negociando", "interesado"];

/** Guess the best stage for a keyword based on simple heuristics */
function guessStage(keyword: string): LeadStage {
  const kw = keyword.toLowerCase();
  if (/compro|pago|transferir|ya te/i.test(kw)) return "compra";
  if (/precio|cuánto|cuesta|envío|garantía|stock|talla|color/i.test(kw)) return "negociando";
  return "interesado";
}

export default function FiltersClient() {
  const [categories, setCategories] = useState<KeywordCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCategories(loadFilters());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveFilters(categories);
  }, [categories, loaded]);

  const addFilter = useCallback(() => {
    const kw = newKeyword.trim();
    if (!kw) return;
    // Check if already exists
    if (categories.some((c) => c.keywords.some((k) => k.toLowerCase() === kw.toLowerCase()))) {
      toast.error(`"${kw}" ya está agregado`);
      return;
    }
    const stage = guessStage(kw);
    setCategories((prev) => [
      ...prev,
      { id: generateId(), name: kw, keywords: [kw], color: getColor(prev.length), stage },
    ]);
    setNewKeyword("");
    inputRef.current?.focus();
  }, [newKeyword, categories]);

  const changeStage = useCallback((id: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const idx = STAGE_ORDER.indexOf(c.stage);
        const nextStage = STAGE_ORDER[(idx + 1) % STAGE_ORDER.length];
        return { ...c, stage: nextStage };
      }),
    );
  }, []);

  const removeFilter = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addFilter();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      <AppNav current="filters" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Carousel */}
        <FilterCarousel categories={categories} />

        {/* Hero copy */}
        <div className="text-center mb-8 mt-6">
          <h1 className="text-lg font-extrabold text-white/90 tracking-tight mb-3">
            Filtros personalizados
          </h1>
          <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
            Vendes <strong style={{ color: "#fe2c55" }}>PS5</strong>, ropa o cualquier producto?{" "}
            Atrapa a los que preguntan por él en el chat.{" "}
            Agrega palabras clave como{" "}
            <strong style={{ color: "#fe2c55" }}>PS5</strong> o{" "}
            <strong style={{ color: "#facc15" }}>PlayStation</strong> y cada vez que alguien las mencione,{" "}
            se clasificará automáticamente como comprador.{" "}
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>Mientras más filtros agregues, más clientes convertirás.</strong>
          </p>
        </div>

        {/* Add filter input */}
        <div className="flex items-center gap-2 mb-8">
          <input
            ref={inputRef}
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe una palabra clave (ej: PS5)"
            className="flex-1 h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.85)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(254,44,85,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
          />
          <button
            type="button"
            onClick={addFilter}
            disabled={!newKeyword.trim()}
            className="h-11 px-5 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0"
            style={{
              backgroundColor: newKeyword.trim() ? "#fe2c55" : "rgba(255,255,255,0.06)",
              color: newKeyword.trim() ? "#fff" : "rgba(255,255,255,0.25)",
              boxShadow: newKeyword.trim() ? "0 4px 16px rgba(254,44,85,0.2)" : "none",
              cursor: newKeyword.trim() ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (newKeyword.trim()) {
                e.currentTarget.style.backgroundColor = "#e8254a";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(254,44,85,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (newKeyword.trim()) {
                e.currentTarget.style.backgroundColor = "#fe2c55";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(254,44,85,0.2)";
              }
            }}
          >
            Agregar
          </button>
        </div>

        {/* Filter list */}
        {!loaded ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </div>
            <p className="text-sm text-white/30">No hay filtros todavía</p>
            <p className="text-xs text-white/20 mt-1">Escribe una palabra arriba y presiona Agregar</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                Tus filtros ({categories.length})
              </span>
            </div>
            {STAGE_ORDER.map((stage) => {
              const group = categories.filter((c) => c.stage === stage);
              if (group.length === 0) return null;
              const grpColor = STAGE_COLORS[stage];
              return (
                <div key={stage}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: grpColor }}
                    />
                    <span
                      className="text-xs font-semibold tracking-wider uppercase"
                      style={{ color: `${grpColor}bb` }}
                    >
                      {STAGE_LABELS[stage]}
                    </span>
                    <span
                      className="text-[10px] font-mono tabular-nums"
                      style={{ color: `${grpColor}55` }}
                    >
                      {group.length}
                    </span>
                  </div>

                  {/* Group items */}
                  <div className="space-y-1">
                    {group.map((cat) => {
                      const cfg = STAGE_COLORS[cat.stage];
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cfg }}
                          />
                          <span className="flex-1 text-sm font-semibold min-w-0 truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                            {cat.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeStage(cat.id)}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all duration-200 shrink-0"
                            style={{
                              backgroundColor: `${cfg}15`,
                              color: cfg,
                            }}
                            title="Toca para cambiar"
                          >
                            {STAGE_LABELS[cat.stage]} ▾
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFilter(cat.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all shrink-0"
                            title="Eliminar filtro"
                          >
                            <svg className="w-3 h-3 text-white/25 hover:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-white/[0.04] py-3 shrink-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[10px] text-white/20">
            Los cambios se guardan automáticamente
          </span>
        </div>
      </footer>

      <Toaster richColors position="bottom-center" />
    </div>
  );
}

/* ── Filter preview carousel ── */

const DEMO_MESSAGES = [
  { text: "Apartame el PS5 porfa 🙏", stage: "compra" as LeadStage },
  { text: "Me interesa el PS5, mándame fotos 🤩", stage: "interesado" as LeadStage },
  { text: "Pasame tu número para la PS5", stage: "compra" as LeadStage },
  { text: "¿Tiene garantía el PlayStation?", stage: "negociando" as LeadStage },
  { text: "Hermosa la PS5, quiero una 😍", stage: "interesado" as LeadStage },
  { text: "Compro la PS5 ahora, dónde pago?", stage: "compra" as LeadStage },
  { text: "¿Todavía hay stock del PS5?", stage: "negociando" as LeadStage },
  { text: "El PS5 viene con accesorios?", stage: "negociando" as LeadStage },
  { text: "Me interesa el PlayStation 5 🙏", stage: "interesado" as LeadStage },
  { text: "Ya te transferí por la PS5!", stage: "compra" as LeadStage },
];

function FilterCarousel({ categories }: { categories: KeywordCategory[] }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
  }, []);

  const handleAnimEnd = useCallback(() => {
    leavingRef.current = false;
    setIndex((prev) => (prev + 1) % DEMO_MESSAGES.length);
    setLeaving(false);
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(advance, 3500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [advance]);

  const current = DEMO_MESSAGES[index];
  const next = DEMO_MESSAGES[(index + 1) % DEMO_MESSAGES.length];

  const allKeywords = categories.flatMap((c) => c.keywords.filter((k) => k.trim()));
  const demoKeywords = ["PS5", "PlayStation", "PlayStation 5"];
  const effectiveKeywords = allKeywords.length > 0 ? allKeywords : demoKeywords;

  const renderHighlighted = (text: string, stageColor: string) => {
    const matched = effectiveKeywords.find((kw) => text.toLowerCase().includes(kw.toLowerCase()));
    if (!matched) return text;
    const escaped = matched.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
      i % 2 === 1
        ? <span key={i} style={{ color: stageColor, fontWeight: 700 }}>{part}</span>
        : part,
    );
  };

  const stageColor = STAGE_COLORS[current.stage];
  const nextColor = STAGE_COLORS[next.stage];

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative w-full overflow-hidden rounded-xl" style={{ height: 80 }}>
        <div
          key={leaving ? "incoming" : "static"}
          className="absolute inset-x-0"
          style={{
            top: 0,
            zIndex: leaving ? 10 : 1,
            animation: leaving ? "slideDownIn 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
          }}
        >
          <DemoMessage data={leaving ? next : current} color={leaving ? nextColor : stageColor} renderHighlighted={renderHighlighted} />
        </div>
        {leaving && (
          <div
            className="absolute inset-x-0"
            style={{
              top: 0,
              zIndex: 5,
              animation: "slideDownOut 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
            }}
            onAnimationEnd={handleAnimEnd}
          >
            <DemoMessage data={current} color={stageColor} renderHighlighted={renderHighlighted} />
          </div>
        )}
      </div>
    </div>
  );
}

function DemoMessage({ data, color, renderHighlighted }: { data: typeof DEMO_MESSAGES[number]; color: string; renderHighlighted: (text: string, color: string) => React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-4 py-3 flex items-start gap-3 w-full"
      style={{
        background: "rgba(18, 22, 33, 0.95)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded leading-none"
            style={{ background: `${color}20`, color }}
          >
            {data.stage === "compra" ? "Compra" : data.stage === "negociando" ? "Negociando" : "Interesado"}
          </span>
          <span className="text-xs font-bold truncate" style={{ color: `${color}cc` }}>
            usuario_ejemplo
          </span>
        </div>
        <p className="text-sm text-white/90 leading-relaxed">
          {renderHighlighted(data.text, color)}
        </p>
      </div>
    </div>
  );
}
