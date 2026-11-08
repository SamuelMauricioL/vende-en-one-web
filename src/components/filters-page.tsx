"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useActiveStoreId } from "@/lib/active-store";
import {
  createFilter,
  deleteFilter,
  fetchFilters,
  groupFiltersByStage,
  normalizeFilters,
  updateFilter,
  type FilterView,
} from "@/lib/filters-api";
import { STAGE_CONFIG, STAGE_ORDER, type LeadStage } from "@/lib/stages";

/** S6: un solo color distingue que algo es un filtro. */
const FILTER_COLOR = "#fe2c55";

type LoadState = "loading" | "ready" | "error";

const STAGE_LABELS: Record<LeadStage, string> = {
  compra: "Compra",
  negociando: "Negociando",
  interesado: "Interesado",
};

export default function FiltersClient() {
  const { getToken } = useAuth();
  const storeId = useActiveStoreId();

  const [filters, setFilters] = useState<FilterView[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const loadSeq = useRef(0);

  /** S1: los filtros son de la tienda activa; se recargan al cambiarla. */
  const load = useCallback(async () => {
    if (!storeId) return;
    const seq = ++loadSeq.current;
    setState("loading");
    setError("");
    try {
      const list = await fetchFilters(storeId, getToken);
      if (seq !== loadSeq.current) return;
      setFilters(list);
      setState("ready");
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(err instanceof Error ? err.message : "");
      setState("error");
    }
  }, [storeId, getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const addFilter = useCallback(async () => {
    const keyword = newKeyword.trim();
    if (!keyword || creating || state !== "ready" || !storeId) return;
    if (filters.some((filter) => filter.keywords.some((k) => k.toLowerCase() === keyword.toLowerCase()))) {
      toast.error(`"${keyword}" ya está agregado`);
      return;
    }

    setCreating(true);
    try {
      const created = await createFilter(storeId, { name: keyword, keywords: [keyword] }, getToken);
      setFilters((prev) => normalizeFilters([...prev, created]));
      setNewKeyword("");
      inputRef.current?.focus();
    } catch {
      toast.error("No pudimos guardar el filtro");
    } finally {
      setCreating(false);
    }
  }, [newKeyword, creating, state, storeId, filters, getToken]);

  const changeStage = useCallback(
    async (filter: FilterView) => {
      if (!storeId || busyId) return;
      const index = STAGE_ORDER.indexOf(filter.stage);
      const stage = STAGE_ORDER[(index + 1) % STAGE_ORDER.length];
      setBusyId(filter.id);
      try {
        const updated = await updateFilter(storeId, filter.id, { stage }, getToken);
        setFilters((prev) =>
          normalizeFilters(prev.map((item) => (item.id === filter.id ? updated : item))),
        );
      } catch {
        toast.error("No pudimos cambiar la etapa");
      } finally {
        setBusyId(null);
      }
    },
    [storeId, busyId, getToken],
  );

  const removeFilter = useCallback(
    async (filter: FilterView) => {
      if (!storeId || busyId) return;
      setBusyId(filter.id);
      try {
        await deleteFilter(storeId, filter.id, getToken);
        setFilters((prev) => prev.filter((item) => item.id !== filter.id));
      } catch {
        toast.error("No pudimos eliminar el filtro");
      } finally {
        setBusyId(null);
      }
    },
    [storeId, busyId, getToken],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") void addFilter();
  };

  const canSubmit = state === "ready" && !!newKeyword.trim() && !creating;
  const groups = groupFiltersByStage(filters);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      <AppNav current="filters" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Carousel */}
        <FilterCarousel />

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
            aria-label="Palabra clave del filtro"
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
            onClick={() => void addFilter()}
            disabled={!canSubmit}
            className="h-11 px-5 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0"
            style={{
              backgroundColor: canSubmit ? FILTER_COLOR : "rgba(255,255,255,0.06)",
              color: canSubmit ? "#fff" : "rgba(255,255,255,0.25)",
              boxShadow: canSubmit ? "0 4px 16px rgba(254,44,85,0.2)" : "none",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (canSubmit) {
                e.currentTarget.style.backgroundColor = "#e8254a";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(254,44,85,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (canSubmit) {
                e.currentTarget.style.backgroundColor = FILTER_COLOR;
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(254,44,85,0.2)";
              }
            }}
          >
            {creating ? "Guardando..." : "Agregar"}
          </button>
        </div>

        {/* Filter list */}
        {state === "loading" ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center justify-center gap-3 py-16"
          >
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
            <span className="text-xs text-white/30">Cargando tus filtros...</span>
          </div>
        ) : state === "error" ? (
          <div role="alert" className="text-center py-16">
            <p className="text-sm text-white/60">No pudimos cargar tus filtros.</p>
            <p className="text-xs text-white/30 mt-1">
              {error || "Revisa tu conexión e intenta de nuevo."}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 h-9 px-4 rounded-xl text-xs font-semibold text-white transition-all duration-200"
              style={{ backgroundColor: FILTER_COLOR }}
            >
              Reintentar
            </button>
          </div>
        ) : filters.length === 0 ? (
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
          <div className="space-y-5" aria-busy={busyId !== null}>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                Tus filtros ({filters.length})
              </span>
            </div>
            {groups.map(({ stage, filters: group }) => {
              const grpColor = STAGE_CONFIG[stage].color;
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
                    {group.map((filter) => (
                      <div
                        key={filter.id}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          opacity: busyId === filter.id ? 0.5 : 1,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: FILTER_COLOR }}
                        />
                        <span className="flex-1 text-sm font-semibold min-w-0 truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                          {filter.name}
                        </span>
                        {filter.editable ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void changeStage(filter)}
                              disabled={busyId !== null}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all duration-200 shrink-0 disabled:cursor-not-allowed"
                              style={{
                                backgroundColor: `${grpColor}15`,
                                color: grpColor,
                              }}
                              title="Toca para cambiar"
                            >
                              {STAGE_LABELS[filter.stage]} ▾
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeFilter(filter)}
                              disabled={busyId !== null}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all shrink-0 disabled:cursor-not-allowed"
                              title="Eliminar filtro"
                              aria-label={`Eliminar filtro ${filter.name}`}
                            >
                              <svg className="w-3 h-3 text-white/25 hover:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold shrink-0"
                            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                            title="Filtro del sistema: no se puede editar"
                          >
                            Sistema
                          </span>
                        )}
                      </div>
                    ))}
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

/** Demo fijo: no depende de los filtros guardados (el resaltado real es del servidor). */
const DEMO_KEYWORDS = ["PS5", "PlayStation", "PlayStation 5"];

function FilterCarousel() {
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

  const renderHighlighted = (text: string, stageColor: string) => {
    const matched = DEMO_KEYWORDS.find((kw) => text.toLowerCase().includes(kw.toLowerCase()));
    if (!matched) return text;
    const escaped = matched.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
      i % 2 === 1
        ? <span key={i} style={{ color: stageColor, fontWeight: 700 }}>{part}</span>
        : part,
    );
  };

  const stageColor = STAGE_CONFIG[current.stage].color;
  const nextColor = STAGE_CONFIG[next.stage].color;

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
            {STAGE_CONFIG[data.stage].label}
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
