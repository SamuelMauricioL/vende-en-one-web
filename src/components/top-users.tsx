"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import { getSSEUrl } from "@/lib/api";
import { loadFilters, getHighlightParts, customStageOverride } from "@/lib/keyword-filters";
import {
  classifyLead,
  getStageIndex,
  STAGE_CONFIG,
  STAGE_ORDER,
  FUNNEL_BAR_PCT,
  type LeadStage,
} from "@/lib/lead-classifier";

import { formatElapsed } from "@/lib/time";

interface TopUser {
  tiktokUserId: string;
  displayId?: string;
  nickname?: string;
  verified?: boolean;
  followerCount?: string;
  entries: number;
  comments: number;
  commentTexts: string[];
  firstSeen: number;
  score: number;
}

interface TopUsersProps {
  sessionId: string;
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
  attendedMap: Map<string, { attendedAt: number; commentCount: number }>;
  onToggleAttended: (userId: string, commentCount?: number) => void;
  maxMobileItems?: number;
  onConnectionError?: (error: string) => void;
}

export function TopUsers({ sessionId, selectedUserIds, onToggleUser, attendedMap, onToggleAttended, maxMobileItems, onConnectionError }: TopUsersProps) {
  const { data: users, connected, status, connectionError } = useSSE<TopUser>(
    getSSEUrl(`/lives/${sessionId}/stats/stream`),
  );

  useEffect(() => {
    if (status === "ended" && onConnectionError) {
      onConnectionError("El live ha finalizado");
    } else if (status === "error" && connectionError && onConnectionError) {
      onConnectionError(connectionError);
    }
  }, [status, connectionError, onConnectionError]);

  const classifierCache = useRef<Map<string, { stage: LeadStage; keyAction: string | null }>>(new Map());
  const customFilters = useMemo(() => loadFilters(), []);

  const enriched = useMemo(() => {
    if (!users) return [];
    return users
      .map((u) => {
        const cacheKey = `${u.tiktokUserId}|${u.commentTexts.join("|")}`;
        const cached = classifierCache.current.get(cacheKey);
        if (cached) return { ...u, ...cached };

        const result = classifyLead(u.commentTexts);
        if (!result) return null;

        // Custom keyword filters override the stage if matched
        const override = customStageOverride(u.commentTexts, customFilters);
        if (override) {
          result.stage = override;
        }

        classifierCache.current.set(cacheKey, result);
        return { ...u, ...result };
      })
      .filter(Boolean)
      .sort((a, b) => {
        return b.firstSeen - a.firstSeen;
      }) as (TopUser & { stage: LeadStage; keyAction: string | null })[];
  }, [users]);

  // Auto-unattend: if an attended user sent new messages, move back to pending
  useEffect(() => {
    if (!enriched || enriched.length === 0) return;
    for (const user of enriched) {
      const info = attendedMap.get(user.tiktokUserId);
      if (info && user.commentTexts.length > info.commentCount) {
        onToggleAttended(user.tiktokUserId);
      }
    }
  }, [enriched, attendedMap, onToggleAttended]);

  const grouped = useMemo(() => {
    const groups: Record<LeadStage, (typeof enriched)[number][]> = {
      interesado: [], negociando: [], compra: [],
    };
    for (const u of enriched) {
      if (groups[u.stage]) groups[u.stage].push(u);
    }
    return groups;
  }, [enriched]);

  const totalUsers = enriched.length;

  const maxStageCount = Math.max(
    ...STAGE_ORDER.map((s) => grouped[s].length),
    1,
  );

  const [tick, setTick] = useState(0);
  const [activeStage, setActiveStage] = useState<"all" | LeadStage>("all");
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const pendingList = enriched
    .filter((u) => !attendedMap.has(u.tiktokUserId))
    .filter((u) => activeStage === "all" || u.stage === activeStage);
  const attendedList = enriched
    .filter((u) => attendedMap.has(u.tiktokUserId))
    .filter((u) => activeStage === "all" || u.stage === activeStage)
    .sort((a, b) => {
      const aTime = attendedMap.get(a.tiktokUserId)?.attendedAt ?? 0;
      const bTime = attendedMap.get(b.tiktokUserId)?.attendedAt ?? 0;
      return bTime - aTime;
    });

  const renderLead = (user: (typeof enriched)[number], index: number, isAttended: boolean) => {
    const hideOnMobile = maxMobileItems && index >= maxMobileItems;
    const cfg = STAGE_CONFIG[user.stage];
    const isSelected = selectedUserIds.has(user.tiktokUserId);
    const stageIndex = getStageIndex(user.stage);

    return (
      <button
        key={user.tiktokUserId}
        type="button"
        onClick={() => onToggleUser(user.tiktokUserId)}
        className={`w-full text-left rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
          isSelected ? "ring-1 ring-white/20" : "hover:ring-1 hover:ring-white/10"
        } ${hideOnMobile ? "max-md:hidden" : ""}`}
        style={{
          backgroundColor: isSelected
            ? "rgba(255,255,255,0.08)"
            : isAttended
              ? "rgba(255,255,255,0.01)"
              : "rgba(255,255,255,0.03)",
          borderLeft: `3px solid ${cfg.color}`,
          opacity: isAttended ? 0.5 : 1,
          textDecoration: isAttended ? "line-through" : "none",
        }}
      >
        <div className="flex h-0.5 w-full bg-white/[0.03]">
          {STAGE_ORDER.map((s, i) => (
            <div
              key={s}
              className="h-full transition-all duration-300"
              style={{
                flex: 1,
                backgroundColor: i <= stageIndex ? STAGE_CONFIG[s].color : "transparent",
                opacity: i === stageIndex ? 1 : 0.3,
              }}
            />
          ))}
        </div>

        <div className="p-2.5 pt-2">
          <div className="flex items-start gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
              style={{
                backgroundColor: cfg.color,
                boxShadow: user.stage === "compra"
                  ? `0 0 8px ${cfg.color}60`
                  : "none",
              }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="font-semibold text-sm truncate"
                  style={{ color: isAttended ? "rgba(255,255,255,0.3)" : cfg.color }}
                >
                  {user.nickname || user.displayId || "Anónimo"}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none shrink-0"
                  style={{
                    backgroundColor: `${cfg.color}18`,
                    color: isAttended ? "rgba(255,255,255,0.25)" : cfg.color,
                  }}
                >
                  {cfg.funnelPct}
                </span>
                <span className="text-[10px] text-white/25 shrink-0">
                  {user.comments} msgs
                </span>
                <span className="text-[10px] text-white/20 shrink-0 font-mono tabular-nums">
                  {formatElapsed(user.firstSeen)}
                </span>
              </div>

              {user.keyAction && (
                <p className="text-xs text-white/50 leading-relaxed line-clamp-1 italic"
                   style={{ textDecoration: isAttended ? "line-through" : "none" }}>
                  &ldquo;
                  {getHighlightParts(user.keyAction, customFilters).map((part, i) =>
                    part.bold ? <strong key={i} className="font-bold text-white/80">{part.text}</strong> : part.text,
                  )}
                  &rdquo;
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleAttended(user.tiktokUserId, user.commentTexts.length); }}
              className="shrink-0 self-center flex items-center gap-1 rounded-full transition-all duration-200 px-2.5 py-1"
              style={{
                backgroundColor: isAttended ? `${cfg.color}22` : "rgba(255,255,255,0.04)",
                border: `1px solid ${isAttended ? cfg.color : "rgba(255,255,255,0.1)"}`,
              }}
              title={isAttended ? "Marcado como atendido" : "Marcar como atendido"}
            >
              <svg
                className="w-3 h-3 transition-all duration-200"
                style={{ color: isAttended ? cfg.color : "rgba(255,255,255,0.25)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={isAttended ? 2.5 : 1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span
                className="text-[10px] font-medium"
                style={{ color: isAttended ? cfg.color : "rgba(255,255,255,0.35)" }}
              >
                {isAttended ? "Atendido" : "Atender"}
              </span>
            </button>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-white/80">Leads en vivo</h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} />
          <span className="text-xs text-white/40">{totalUsers} interactuaron</span>
        </div>
      </div>

      {/* Stage filter tabs */}
      <div className="flex items-center gap-1 mb-3 shrink-0 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveStage("all")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
          style={{
            backgroundColor: activeStage === "all" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
            color: activeStage === "all" ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
          }}
        >
          Todos <span className="font-mono tabular-nums text-[11px]">{totalUsers}</span>
        </button>
        {STAGE_ORDER.map((stage) => {
          const count = grouped[stage].length;
          const cfg = STAGE_CONFIG[stage];
          const isActive = activeStage === stage;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setActiveStage(isActive ? "all" : stage)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
              style={{
                backgroundColor: isActive ? `${cfg.color}20` : "rgba(255,255,255,0.04)",
                color: isActive ? cfg.color : "rgba(255,255,255,0.35)",
              }}
            >
              {cfg.label}
              <span className="font-mono tabular-nums text-[11px]" style={{ opacity: isActive ? 1 : 0.5 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
        {!enriched || enriched.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-12">
            {status === "error"
              ? `Error de conexión: ${connectionError || "desconocido"}`
              : status === "connecting"
                ? "Conectando al live..."
                : connected
                  ? "Esperando mensajes..."
                  : "Conectando..."}
          </p>
        ) : (
          <>
            {pendingList.length === 0 && attendedList.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-12">Esperando mensajes...</p>
            ) : (
              <>
                {pendingList.map((user, index) => renderLead(user, index, false))}

                {attendedList.length > 0 && (
                  <div className="flex items-center gap-3 py-2 mt-2 mb-1">
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <span className="text-[10px] font-medium text-white/20 shrink-0">
                      Atendidos ({attendedList.length})
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  </div>
                )}

                {attendedList.map((user, index) => renderLead(user, index, true))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
