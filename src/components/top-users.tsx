"use client";

import { useEffect, useMemo, useState } from "react";
import { useSSE } from "@/hooks/useSSE";

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
}

type LeadStage = "espectador" | "interesado" | "lead" | "caliente" | "compra";

const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; funnelPct: string }> = {
  espectador: { label: "Espectador", color: "#25f4ee", funnelPct: "100%" },
  interesado: { label: "Interesado", color: "#4ade80", funnelPct: "40%" },
  lead:        { label: "Lead", color: "#facc15", funnelPct: "18%" },
  caliente:    { label: "Caliente", color: "#fb923c", funnelPct: "8%" },
  compra:      { label: "Compra", color: "#fe2c55", funnelPct: "3%" },
};

const STAGE_ORDER: LeadStage[] = ["compra", "caliente", "lead", "interesado", "espectador"];

// Funnel bar widths in percent (visual funnel shape)
const FUNNEL_BAR_PCT: Record<LeadStage, number> = {
  espectador: 100,
  interesado: 65,
  lead: 40,
  caliente: 22,
  compra: 10,
};

const INTENT_PATTERNS: { stage: LeadStage; keywords: RegExp[] }[] = [
  {
    stage: "compra",
    keywords: [
      /compro/i, /quiero \d/i, /aparta/, /ya te hice/i, /dónde pago/i,
      /lo quiero/i, /transfier/, /ya pagu/, /deposité/i,
    ],
  },
  {
    stage: "caliente",
    keywords: [
      /whatsapp/i, /escríbeme/i, /dm\b/i, /pasame tu/i, /número/i,
      /yape/i, /plin/i, /contraentrega/i, /transferencia/i,
      /mándame dm/i, /escríbeme al/i,
    ],
  },
  {
    stage: "lead",
    keywords: [
      /precio/i, /cuánto cuesta/i, /envío/i, /stock/i, /talla/i,
      /garantía/i, /descuento/i, /por mayor/i, /color /i, /modelo/i,
      /disponible/i, /cuándo me llega/i,
    ],
  },
  {
    stage: "interesado",
    keywords: [
      /me interesa/i, /me encantó/i, /hermoso/i, /fotos?/i,
      /info/i, /más detalles/i, /cómo es/i, /se ve/i, /bonito/i,
    ],
  },
];

function classifyLead(comments: string[]): LeadStage {
  const allText = comments.join(" ");
  for (const group of INTENT_PATTERNS) {
    for (const pattern of group.keywords) {
      if (pattern.test(allText)) return group.stage;
    }
  }
  if (comments.length > 0) return "interesado";
  return "espectador";
}

function getKeyAction(comments: string[]): string | null {
  const allText = comments.join(" ");
  for (const group of INTENT_PATTERNS) {
    for (const pattern of group.keywords) {
      if (pattern.test(allText)) {
        const matchedComment = comments.find((c) => pattern.test(c));
        if (matchedComment) return matchedComment;
      }
    }
  }
  return comments[0] ?? null;
}

function getStageIndex(stage: LeadStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function TopUsers({ sessionId, selectedUserIds, onToggleUser }: TopUsersProps) {
  const { data: users, connected } = useSSE<TopUser>(
    `/api/lives/${sessionId}/stats/stream`,
  );

  const enriched = useMemo(() => {
    if (!users) return [];
    return users.map((u) => {
      const stage = classifyLead(u.commentTexts);
      const keyAction = getKeyAction(u.commentTexts);
      return { ...u, stage, keyAction };
    });
  }, [users]);

  const grouped = useMemo(() => {
    const groups: Record<LeadStage, (typeof enriched)[number][]> = {
      espectador: [], interesado: [], lead: [], caliente: [], compra: [],
    };
    for (const u of enriched) {
      if (groups[u.stage]) groups[u.stage].push(u);
    }
    return groups;
  }, [enriched]);

  const totalUsers = enriched.length;

  // Find max count for funnel bar scaling
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/80">Leads en vivo</h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} />
          <span className="text-xs text-white/40">{totalUsers} usuarios</span>
        </div>
      </div>

      {/* Visual funnel bar — mimics the landing page funnel */}
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
                  {/* Label */}
                  <span
                    className="text-[10px] font-medium w-16 text-right shrink-0"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>

                  {/* Funnel bar */}
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
                      {/* Fill proportional to count */}
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

                  {/* Count */}
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
      <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[420px] pr-1">
        {!enriched || enriched.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-12">
            {connected ? "Esperando usuarios..." : "Conectando..."}
          </p>
        ) : (
          enriched.map((user) => {
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
                {/* Stage progress line (mini funnel indicator) */}
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

                <div className="p-3 pt-2.5">
                  <div className="flex items-start gap-2.5">
                    {/* Stage dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                      style={{
                        backgroundColor: cfg.color,
                        boxShadow: user.stage === "compra" || user.stage === "caliente"
                          ? `0 0 8px ${cfg.color}60`
                          : "none",
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Username + stage + funnel pct */}
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
                      </div>

                      {/* Key action */}
                      {user.keyAction && (
                        <p className="text-xs text-white/50 leading-relaxed mt-1 line-clamp-2 italic">
                          &ldquo;{user.keyAction}&rdquo;
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/25">
                        <span>{user.entries} visitas</span>
                        <span>{user.comments} msgs</span>
                        {user.followerCount && (
                          <span>{user.followerCount} seguidores</span>
                        )}
                      </div>
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
