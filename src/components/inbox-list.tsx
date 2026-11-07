"use client";

import { useMemo, useState } from "react";
import {
  durationLabel,
  isUnread,
  pendingForLive,
  stageCountsForLive,
  type Conversation,
  type InboxState,
} from "@/lib/inbox-state";
import { STAGE_CONFIG } from "@/lib/lead-classifier";

export type InboxFilter = { kind: "all" } | { kind: "closed" } | { kind: "live"; sessionId: string };

interface InboxListProps {
  conversations: Conversation[];
  lives: { sessionId: string; label: string; startedAt: number; endedAt: number }[];
  inbox: InboxState;
  onOpen: (key: string) => void;
}

export function InboxList({ conversations, lives, inbox, onOpen }: InboxListProps) {
  const [filter, setFilter] = useState<InboxFilter>({ kind: "all" });
  const [query, setQuery] = useState("");

  const pendingTotal = conversations.filter((c) => !c.closed).length;

  const visible = useMemo(() => {
    let list = conversations;
    if (filter.kind === "closed") list = list.filter((c) => c.closed);
    if (filter.kind === "live")
      list = list.filter((c) => c.liveTags.some((t) => t.sessionId === filter.sessionId));
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q),
      );
    return list;
  }, [conversations, filter, query]);

  return (
    <div>
      {/* Chips de live */}
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
          Todos · {pendingTotal}
        </button>
        {lives.map((live) => {
          const pending = pendingForLive(conversations, live.sessionId);
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
                  : pending
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(255,255,255,0.03)",
                color: active
                  ? "#25f4ee"
                  : pending
                    ? "rgba(255,255,255,0.75)"
                    : "rgba(255,255,255,0.25)",
              }}
            >
              {live.label}
              {pending > 0 && <span className="ml-1 tabular-nums">{pending}</span>}
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

      {/* Métricas del live seleccionado: duración y leads por etapa */}
      {filter.kind === "live" && (() => {
        const live = lives.find((l) => l.sessionId === filter.sessionId);
        if (!live) return null;
        const counts = stageCountsForLive(conversations, live.sessionId);
        const hasLeads = Object.values(counts).some((c) => c > 0);
        return (
          <p className="text-[11px] text-white/30 mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="tabular-nums">{durationLabel(live.startedAt, live.endedAt)}</span>
            {hasLeads &&
              (["compra", "negociando", "interesado"] as const)
                .filter((stage) => counts[stage] > 0)
                .map((stage) => (
                  <span key={stage} style={{ color: STAGE_CONFIG[stage].color }}>
                    · {counts[stage]} {STAGE_CONFIG[stage].label.toLowerCase()}
                  </span>
                ))}
            {!hasLeads && <span>· sin leads con intención</span>}
          </p>
        );
      })()}

      {/* Buscador */}
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
          {visible.map((conv) => {
            const entry = inbox[conv.key];
            const unread = isUnread(conv, entry);
            const lastTag = conv.liveTags[0];
            return (
              <li key={conv.key}>
                <button
                  type="button"
                  onClick={() => onOpen(conv.key)}
                  className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      background: unread
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
                      <span className="text-[10px] text-white/25 shrink-0">{lastTag?.label}</span>
                    </span>
                    <span className="block text-xs text-white/35 truncate mt-0.5">
                      {conv.lastMessage}
                    </span>
                  </span>
                  <span className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[10px] text-white/25 tabular-nums">
                      {conv.totalMessages} msgs
                    </span>
                    {unread && !conv.closed && (
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
