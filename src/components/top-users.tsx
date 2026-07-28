"use client";

import { useEffect, useMemo, useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import {
  classifyLead,
  getKeyAction,
  getStageIndex,
  STAGE_CONFIG,
  STAGE_ORDER,
  FUNNEL_BAR_PCT,
  type LeadStage,
} from "@/lib/lead-classifier";

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
  attendedUserIds: Set<string>;
  onToggleAttended: (userId: string) => void;
  maxMobileItems?: number;
  onConnectionError?: (error: string) => void;
}

export function TopUsers({ sessionId, selectedUserIds, onToggleUser, attendedUserIds, onToggleAttended, maxMobileItems, onConnectionError }: TopUsersProps) {
  const { data: users, connected, status, connectionError } = useSSE<TopUser>(
    `/api/lives/${sessionId}/stats/stream`,
  );

  // React to connection errors
  useEffect(() => {
    if (status === "error" && connectionError && onConnectionError) {
      onConnectionError(connectionError);
    }
  }, [status, connectionError, onConnectionError]);

  const enriched = useMemo(() => {
    if (!users) return [];
    return users
      .map((u) => {
        const stage = classifyLead(u.commentTexts);
        if (!stage) return null;
        const keyAction = getKeyAction(u.commentTexts);
        return { ...u, stage, keyAction };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aIdx = STAGE_ORDER.indexOf(a!.stage);
        const bIdx = STAGE_ORDER.indexOf(b!.stage);
        return aIdx - bIdx;
      }) as (TopUser & { stage: LeadStage; keyAction: string | null })[];
  }, [users]);

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
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-white/80">Leads en vivo</h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} />
          <span className="text-xs text-white/40">{totalUsers} interactuaron</span>
        </div>
      </div>

      {/* Visual funnel */}
      <div className="mb-5 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="px-3 pt-2.5 pb-3">
          <div className="flex flex-col items-center gap-1">
            {STAGE_ORDER.map((stage) => {
              const count = grouped[stage].length;
              const cfg = STAGE_CONFIG[stage];
              const pctWidth = FUNNEL_BAR_PCT[stage];
              const barHeight = Math.max(6, count === 0 ? 4 : (count / maxStageCount) * 20);

              return (
                <div key={stage} className="flex items-center gap-2 w-full">
                  <span
                    className="text-[10px] font-medium w-14 text-right shrink-0"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>

                  <div className="flex-1 flex justify-center">
                    <div
                      className="rounded-full transition-all duration-500"
                      style={{
                        width: `${pctWidth}%`,
                        height: barHeight,
                        backgroundColor: `${cfg.color}25`,
                        border: `1px solid ${cfg.color}30`,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: count === 0 ? "0%" : `${Math.max(5, (count / Math.max(maxStageCount, 1)) * 100)}%`,
                          backgroundColor: cfg.color,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>

                  <span className="text-[10px] text-white/40 w-6 text-left shrink-0 font-mono">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User list */}
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
          enriched.map((user, index) => {
            const hideOnMobile = maxMobileItems && index >= maxMobileItems;
            const cfg = STAGE_CONFIG[user.stage];
            const isSelected = selectedUserIds.has(user.tiktokUserId);
            const isAttended = attendedUserIds.has(user.tiktokUserId);
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
                  opacity: isAttended ? 0.55 : 1,
                }}
              >
                {/* Stage progress line */}
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
                          style={{ color: cfg.color }}
                        >
                          {user.nickname || user.displayId || "Anónimo"}
                        </span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none shrink-0"
                          style={{
                            backgroundColor: `${cfg.color}18`,
                            color: cfg.color,
                          }}
                        >
                          {cfg.funnelPct}
                        </span>
                        <span className="text-[10px] text-white/25 shrink-0">
                          {user.comments} msgs
                        </span>
                        {user.followerCount && (
                          <span className="text-[10px] text-white/25 shrink-0 truncate max-w-[80px]">
                            {user.followerCount} seg
                          </span>
                        )}
                      </div>

                      {user.keyAction && (
                        <p className="text-xs text-white/50 leading-relaxed line-clamp-1 italic">
                          &ldquo;{user.keyAction}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Atendido button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleAttended(user.tiktokUserId); }}
                    className="shrink-0 self-center w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                    style={{
                      backgroundColor: isAttended ? `${cfg.color}22` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isAttended ? cfg.color : "rgba(255,255,255,0.1)"}`,
                    }}
                    title={isAttended ? "Marcado como atendido" : "Marcar como atendido"}
                  >
                    <svg
                      className="w-3.5 h-3.5 transition-all duration-200"
                      style={{ color: isAttended ? cfg.color : "rgba(255,255,255,0.25)" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={isAttended ? 2.5 : 1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </button>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
