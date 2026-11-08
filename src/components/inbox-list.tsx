"use client";

import { useMemo, useState } from "react";
import { liveFilters, OUTCOME_COLOR, OUTCOME_LABEL, type Conversation } from "@/lib/inbox-api";
import type { LiveBand } from "@/lib/inbox-live";

interface InboxListProps {
  conversations: Conversation[];
  /** Cuando se ven varias tiendas, cada fila dice de cuál es. */
  showStore?: boolean;
  /** S9: bloque pinneado; ausente o invisible = bandeja como siempre. */
  band?: LiveBand;
  /** Claves que entraron por el stream: solo esas destellan. */
  freshKeys?: string[];
  onOpen: (conversation: Conversation) => void;
}

const BAND_STYLE: Record<LiveBand["tone"], { background: string; color: string; border: string }> = {
  live: { background: "rgba(254,44,85,0.14)", color: "#ff7591", border: "1px solid rgba(254,44,85,0.3)" },
  pending: { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" },
  warning: { background: "rgba(245,158,11,0.14)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.35)" },
};

export function InboxList({
  conversations,
  showStore = false,
  band,
  freshKeys = [],
  onOpen,
}: InboxListProps) {
  const [filter, setFilter] = useState<{ kind: "all" | "closed" | "live"; sessionId?: string }>({
    kind: "all",
  });
  const [query, setQuery] = useState("");

  const lives = useMemo(() => liveFilters(conversations), [conversations]);
  const pending = conversations.filter((c) => !c.closed).length;

  const visible = useMemo(() => {
    let list = conversations;
    if (filter.kind === "closed") list = list.filter((c) => c.closed);
    if (filter.kind === "live")
      list = list.filter((c) => c.liveTags.some((t) => t.sessionId === filter.sessionId));
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.lastText.toLowerCase().includes(q),
      );
    return list;
  }, [conversations, filter, query]);

  return (
    <div>
      {/* S9: el bloque solo existe mientras hay live; las filas no anuncian nada. */}
      {band?.visible && (
        <div
          className="sticky top-0 z-10 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur"
          style={{
            background: BAND_STYLE[band.tone].background,
            color: BAND_STYLE[band.tone].color,
            border: BAND_STYLE[band.tone].border,
          }}
        >
          <span className="truncate">{band.label}</span>
          {band.countLabel && (
            <span aria-live="polite" className="shrink-0 tabular-nums opacity-80">
              · {band.countLabel}
            </span>
          )}
        </div>
      )}

      {/* Chips por live */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter({ kind: "all" })}
          className="shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-colors"
          style={{
            background: filter.kind === "all" ? "rgba(254,44,85,0.15)" : "rgba(255,255,255,0.04)",
            color: filter.kind === "all" ? "#fe2c55" : "rgba(255,255,255,0.4)",
          }}
        >
          Todos los lives · {pending}
        </button>
        {lives.map((live) => {
          const active = filter.kind === "live" && filter.sessionId === live.sessionId;
          return (
            <button
              key={live.sessionId}
              type="button"
              onClick={() => setFilter({ kind: "live", sessionId: live.sessionId })}
              className="shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: active
                  ? "rgba(37,244,238,0.15)"
                  : live.pending
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(255,255,255,0.03)",
                color: active
                  ? "#25f4ee"
                  : live.pending
                    ? "rgba(255,255,255,0.75)"
                    : "rgba(255,255,255,0.25)",
              }}
            >
              {live.label}
              {live.pending > 0 && <span className="ml-1 tabular-nums">{live.pending}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setFilter({ kind: "closed" })}
          className="shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-colors"
          style={{
            background: filter.kind === "closed" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
            color: filter.kind === "closed" ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
          }}
        >
          Cerrados
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre o mensaje"
        className="w-full h-10 mt-3 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white/85 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/40"
      />

      {visible.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-white/30">
            {filter.kind === "closed"
              ? "Todavía no cerraste ninguna conversación"
              : conversations.length === 0
                ? "Todavía no hay conversaciones"
                : "Nadie coincide con ese filtro"}
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-1">
          {visible.map((conv) => (
            <li key={conv.key} className={freshKeys.includes(conv.key) ? "inbox-row-flash rounded-xl" : undefined}>
              <button
                type="button"
                onClick={() => onOpen(conv)}
                className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: conv.unread
                      ? "#fe2c55"
                      : conv.closed
                        ? "rgba(74,222,128,0.5)"
                        : "rgba(255,255,255,0.2)",
                  }}
                />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white/85 truncate">
                      {conv.name}
                    </span>
                    {/* S10: el estado lo produce el resolutor; acá solo se muestra. */}
                    {conv.outcome && (
                      <span
                        className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded leading-none"
                        style={{
                          color: OUTCOME_COLOR[conv.outcome],
                          background: "rgba(255,255,255,0.06)",
                        }}
                      >
                        {OUTCOME_LABEL[conv.outcome]}
                      </span>
                    )}
                    <span className="text-[10px] text-white/25 shrink-0">
                      {showStore && conv.storeLabel ? `${conv.storeLabel} · ` : ""}
                      {conv.liveTags[0]?.label}
                    </span>
                  </span>
                  <span className="block text-xs text-white/35 truncate mt-0.5">
                    {conv.lastText}
                  </span>
                </span>
                <span className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[10px] text-white/25 tabular-nums">
                    {conv.totalMessages} msgs
                  </span>
                  {conv.unread && !conv.closed && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(254,44,85,0.15)", color: "#fe2c55" }}
                    >
                      NUEVO
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Destello de fila nueva: breve, decorativo y sin anuncio. */}
      <style>{`
        @keyframes inboxRowFlash {
          from { background-color: rgba(254,44,85,0.18); }
          to { background-color: transparent; }
        }
        .inbox-row-flash { animation: inboxRowFlash 1.4s ease-out; }
        @media (prefers-reduced-motion: reduce) { .inbox-row-flash { animation: none; } }
      `}</style>
    </div>
  );
}
