"use client";

import { useEffect, useMemo, useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import {
  classifyLead,
  getKeyAction,
  getStageIndex,
  STAGE_CONFIG,
  STAGE_ORDER,
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

interface LeadsMobileProps {
  sessionId: string;
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
  onConnectionError?: (error: string) => void;
}

export function LeadsMobile({ sessionId, selectedUserIds, onToggleUser, onConnectionError }: LeadsMobileProps) {
  const { data: users, connected, status, connectionError } = useSSE<TopUser>(
    `/api/lives/${sessionId}/stats/stream`,
  );

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

  const [activeTab, setActiveTab] = useState<LeadStage>("compra");

  const filtered = useMemo(() => {
    return enriched.filter((u) => u.stage === activeTab);
  }, [enriched, activeTab]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(iv);
  }, []);

  const stageLabel: Record<LeadStage, string> = {
    compra: "Compra",
    negociando: "Negociando",
    interesado: "Interesado",
  };

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

      {/* Tab header */}
      <div className="flex mb-3 rounded-xl overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {STAGE_ORDER.map((stage) => {
          const isActive = activeTab === stage;
          const cfg = STAGE_CONFIG[stage];
          const count = grouped[stage].length;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setActiveTab(stage)}
              className="flex-1 relative py-2 text-[11px] font-semibold transition-all duration-200"
              style={{
                color: isActive ? cfg.color : "rgba(255,255,255,0.35)",
              }}
            >
              {cfg.label}
              {count > 0 && (
                <span
                  className="ml-1 text-[10px] font-mono"
                  style={{ opacity: isActive ? 1 : 0.4 }}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* User list — filtered by active tab */}
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
        ) : filtered.length === 0 ? (
          <p className="text-sm text-white/20 text-center py-8">
            No hay leads en &ldquo;{stageLabel[activeTab]}&rdquo;
          </p>
        ) : (
          filtered.map((user) => {
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
                }`}
                style={{
                  backgroundColor: isSelected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  borderLeft: `3px solid ${cfg.color}`,
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
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
