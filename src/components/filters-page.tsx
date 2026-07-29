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

export default function FiltersClient() {
  const [categories, setCategories] = useState<KeywordCategory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCategories(loadFilters());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveFilters(categories);
  }, [categories, loaded]);

  const addCategory = useCallback(() => {
    setCategories((prev) => [
      ...prev,
      { id: generateId(), name: "", keywords: [], color: getColor(prev.length), stage: "interesado" },
    ]);
  }, []);

  const updateCategory = useCallback(
    (id: string, patch: Partial<KeywordCategory>) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
    },
    [],
  );

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success("Categoría eliminada");
  }, []);

  const addKeyword = useCallback((catId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, keywords: [...c.keywords, ""] } : c,
      ),
    );
  }, []);

  const updateKeyword = useCallback(
    (catId: string, index: number, value: string) => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId
            ? {
                ...c,
                keywords: c.keywords.map((kw, i) => (i === index ? value : kw)),
              }
            : c,
        ),
      );
    },
    [],
  );

  const removeKeyword = useCallback((catId: string, index: number) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, keywords: c.keywords.filter((_, i) => i !== index) }
          : c,
      ),
    );
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0b0f1a" }}
    >
      <AppNav current="filters" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Chat carousel — shows how filters work visually */}
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

        {/* Actions bar */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            {categories.length} {categories.length === 1 ? "categoría" : "categorías"}
          </span>
          <button
            type="button"
            onClick={addCategory}
            className="h-9 px-4 bg-[#fe2c55] hover:bg-[#fe2c55]/80 text-white font-semibold text-xs rounded-xl transition-all shrink-0"
          >
            + Nueva categoría
          </button>
        </div>

        {!loaded ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <svg
                className="w-6 h-6 text-white/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                />
              </svg>
            </div>
            <p className="text-sm text-white/30">
              No hay filtros personalizados
            </p>
            <p className="text-xs text-white/20 mt-1">
              Agrega categorías con palabras clave para resaltar productos en el
              chat
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat, index) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                index={index}
                onUpdate={(patch) => updateCategory(cat.id, patch)}
                onRemove={() => removeCategory(cat.id)}
                onAddKeyword={() => addKeyword(cat.id)}
                onUpdateKeyword={(i, v) => updateKeyword(cat.id, i, v)}
                onRemoveKeyword={(i) => removeKeyword(cat.id, i)}
              />
            ))}
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

/* ── Category card ── */

function CategoryCard({
  category,
  index,
  onUpdate,
  onRemove,
  onAddKeyword,
  onUpdateKeyword,
  onRemoveKeyword,
}: {
  category: KeywordCategory;
  index: number;
  onUpdate: (patch: Partial<KeywordCategory>) => void;
  onRemove: () => void;
  onAddKeyword: () => void;
  onUpdateKeyword: (i: number, v: string) => void;
  onRemoveKeyword: (i: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: category.color }}
          />
          <input
            type="text"
            value={category.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Nombre de la categoría (ej: PS5)"
            className="flex-1 bg-transparent text-sm font-semibold text-white/80 placeholder:text-white/20 focus:outline-none min-w-0"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(["compra", "negociando", "interesado"] as LeadStage[]).map((s) => {
            const isActive = category.stage === s;
            const stageColor =
              s === "compra" ? "#fe2c55" : s === "negociando" ? "#facc15" : "#4ade80";
            return (
              <button
                key={s}
                type="button"
                onClick={() => onUpdate({ stage: s })}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"
                style={{
                  backgroundColor: isActive ? `${stageColor}20` : "rgba(255,255,255,0.04)",
                  color: isActive ? stageColor : "rgba(255,255,255,0.3)",
                }}
              >
                {s === "compra" ? "Compra" : s === "negociando" ? "Negociando" : "Interesado"}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all shrink-0"
            title="Eliminar categoría"
          >
            <svg
              className="w-3.5 h-3.5 text-white/30 hover:text-[#fe2c55]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((p) => !p)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all shrink-0"
          >
            <svg
              className={`w-3.5 h-3.5 text-white/30 transition-transform ${collapsed ? "-rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          {/* Existing keywords */}
          {category.keywords.map((kw, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={kw}
                onChange={(e) => onUpdateKeyword(i, e.target.value)}
                placeholder="Palabra clave (ej: PS5, PlayStation 5)"
                className="flex-1 h-9 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white/70 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#fe2c55]/50"
              />
              <button
                type="button"
                onClick={() => onRemoveKeyword(i)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all shrink-0"
              >
                <svg
                  className="w-3 h-3 text-white/25 hover:text-white/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}

          {/* Add keyword */}
          <button
            type="button"
            onClick={onAddKeyword}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors py-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Añadir palabra clave
          </button>

          {/* Preview */}
          {category.name && category.keywords.some((k) => k.trim()) && (
            <div
              className="mt-3 px-3 py-2 rounded-lg text-sm"
              style={{
                background: `${category.color}08`,
                border: `1px solid ${category.color}15`,
              }}
            >
              <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-wider font-semibold">
                <span>Vista previa</span>
                <span className="text-white/20">·</span>
                <span>
                  {category.stage === "compra"
                    ? "Compra"
                    : category.stage === "negociando"
                      ? "Negociando"
                      : "Interesado"}
                </span>
              </div>
              <p className="mt-1 text-white/60 text-xs">
                Mensaje de ejemplo con{" "}
                <strong style={{ color: category.color }}>
                  {category.keywords.find((k) => k.trim())}
                </strong>{" "}
                resaltado
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Filter preview carousel ── */

const DEMO_MESSAGES = [
  { text: "Apartame el PS5 porfa 🙏", stage: "compra" },
  { text: "Me interesa el PS5, mándame fotos 🤩", stage: "interesado" },
  { text: "Pasame tu número para la PS5", stage: "compra" },
  { text: "¿Tiene garantía el PlayStation?", stage: "negociando" },
  { text: "Hermosa la PS5, quiero una 😍", stage: "interesado" },
  { text: "Compro la PS5 ahora, dónde pago?", stage: "compra" },
  { text: "¿Todavía hay stock del PS5?", stage: "negociando" },
  { text: "El PS5 viene con accesorios?", stage: "negociando" },
  { text: "Me interesa el PlayStation 5 🙏", stage: "interesado" },
  { text: "Ya te transferí por la PS5!", stage: "compra" },
];

const STAGE_COLORS = {
  compra: "#fe2c55",
  negociando: "#facc15",
  interesado: "#4ade80",
};

function FilterCarousel({ categories }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const intervalRef = useRef(null);

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

  const renderHighlighted = (text, stageColor) => {
    const matched = effectiveKeywords.find((kw) => text.toLowerCase().includes(kw.toLowerCase()));
    if (!matched) return text;
    const idx = text.toLowerCase().indexOf(matched.toLowerCase());
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + matched.length);
    const after = text.slice(idx + matched.length);
    return [before, <strong key="h" style={{ color: stageColor }}>{match}</strong>, after];
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

function DemoMessage({ data, color, renderHighlighted }) {
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
