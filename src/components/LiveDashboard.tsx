"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import {
  classifyLead,
  getKeyAction,
  getStageIndex,
  STAGE_CONFIG,
  type LeadStage,
} from "@/lib/lead-classifier";

/* ── Types ── */

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

interface ChatMessage {
  id: string;
  tiktokUserId?: string;
  displayId?: string;
  nickname?: string;
  verified?: boolean;
  followerCount?: string;
  comment: string;
  createdAt: number;
}

type StageFilter = "all" | LeadStage;

/* ── Constants ── */

const STAGE_EMOJI: Record<LeadStage, string> = {
  compra: "🔥",
  negociando: "💬",
  interesado: "👀",
};

const STAGE_FILTERS: { key: StageFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "compra", label: "Compra" },
  { key: "negociando", label: "Negociando" },
  { key: "interesado", label: "Interesado" },
];

/* ── Lead card (shared between mobile & desktop) ── */

function LeadCard({
  user,
  isSelected,
  onToggleUser,
  compact,
}: {
  user: TopUser & { stage: LeadStage; keyAction: string | null };
  isSelected: boolean;
  onToggleUser: () => void;
  compact?: boolean;
}) {
  const cfg = STAGE_CONFIG[user.stage];

  if (compact) {
    return (
      <button
        type="button"
        onClick={onToggleUser}
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all duration-200 whitespace-nowrap"
        style={{
          backgroundColor: isSelected ? `${cfg.color}20` : "rgba(255,255,255,0.04)",
          border: `1px solid ${isSelected ? cfg.color : "rgba(255,255,255,0.06)"}`,
        }}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
        <span className="font-semibold truncate max-w-[80px] text-white/80">
          {user.nickname || user.displayId}
        </span>
        {user.keyAction && (
          <span className="text-white/40 truncate max-w-[120px] italic text-[11px]">
            {user.keyAction}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggleUser}
      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-all duration-200"
      style={{
        backgroundColor: isSelected ? `${cfg.color}12` : "transparent",
      }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
      <span
        className="font-semibold truncate"
        style={{ color: isSelected ? cfg.color : "rgba(255,255,255,0.8)" }}
      >
        {user.nickname || user.displayId}
      </span>
      <span className="text-[11px] shrink-0">{STAGE_EMOJI[user.stage]}</span>
      {user.keyAction && (
        <span className="text-white/30 truncate italic ml-auto min-w-0 max-w-[160px]">
          {user.keyAction}
        </span>
      )}
    </button>
  );
}

/* ── Stage pill ── */

function StagePill({
  isActive,
  count,
  label,
  color,
  onClick,
}: {
  isActive: boolean;
  count: number;
  label: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap"
      style={{
        backgroundColor: isActive
          ? color
            ? `${color}20`
            : "rgba(255,255,255,0.1)"
          : "rgba(255,255,255,0.04)",
        color: isActive
          ? color ?? "rgba(255,255,255,0.8)"
          : "rgba(255,255,255,0.4)",
      }}
    >
      <span className="font-mono tabular-nums">{count}</span>
      <span>{label}</span>
    </button>
  );
}

/* ── LiveDashboard component ── */

export function LiveDashboard({
  sessionId,
  onConnectionError,
}: {
  sessionId: string;
  onConnectionError?: (error: string) => void;
}) {
  /* ── SSE ── */
  const {
    data: users,
    connected: usersConnected,
    status: usersStatus,
    connectionError: usersError,
  } = useSSE<TopUser>(`/api/lives/${sessionId}/stats/stream`);

  const {
    data: messages,
    connected: chatConnected,
    status: chatStatus,
    connectionError: chatError,
  } = useSSE<ChatMessage>(`/api/lives/${sessionId}/chat/stream`);

  useEffect(() => {
    if ((usersStatus === "error" || chatStatus === "error") && onConnectionError) {
      const err = usersError || chatError || "desconocido";
      onConnectionError(err);
    }
  }, [usersStatus, chatStatus, usersError, chatError, onConnectionError]);

  /* ── Derive enriched users ── */
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
        const stageDiff = getStageIndex((a as any).stage) - getStageIndex((b as any).stage);
        if (stageDiff !== 0) return stageDiff;
        return (b as any).firstSeen - (a as any).firstSeen;
      }) as (TopUser & { stage: LeadStage; keyAction: string | null })[];
  }, [users]);

  /* ── Stage counts ── */
  const stageCounts = useMemo(() => {
    const counts = { compra: 0, negociando: 0, interesado: 0 };
    for (const u of enriched) counts[u.stage]++;
    return counts;
  }, [enriched]);

  /* ── Filter state ── */
  const [activeStage, setActiveStage] = useState<StageFilter>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  /* ── Filtered leads ── */
  const filteredLeads = useMemo(() => {
    if (activeStage === "all") return enriched;
    return enriched.filter((u) => u.stage === activeStage);
  }, [enriched, activeStage]);

  /* ── Filtered messages ── */
  const filteredMessages = useMemo(() => {
    if (!messages) return [];

    const stageUserIds =
      activeStage === "all"
        ? null
        : new Set(enriched.filter((u) => u.stage === activeStage).map((u) => u.tiktokUserId));

    return messages.filter((m) => {
      if (selectedUserId && m.tiktokUserId !== selectedUserId) return false;
      if (stageUserIds && (!m.tiktokUserId || !stageUserIds.has(m.tiktokUserId))) return false;
      return true;
    });
  }, [messages, enriched, activeStage, selectedUserId]);

  /* ── Auto-scroll chat ── */
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [filteredMessages.length]);

  /* ── Derive state ── */
  const isConnected = usersConnected || chatConnected;
  const totalUsers = enriched.length;
  const hasUserFilter = !!selectedUserId;
  const selectedUser = selectedUserId ? enriched.find((u) => u.tiktokUserId === selectedUserId) : null;

  /* ── Handle pill click ── */
  const handleStageClick = (stage: StageFilter) => {
    setActiveStage(stage);
    setSelectedUserId(null);
  };

  /* ── Render ── */

  if (!isConnected && enriched.length === 0 && (!messages || messages.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
        <p className="text-sm text-white/40">
          {usersStatus === "error" || chatStatus === "error"
            ? "Error de conexión"
            : "Conectando al live..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Stage filter pills ── */}
      <div className="flex items-center gap-1.5 mb-3 shrink-0 overflow-x-auto no-scrollbar">
        {STAGE_FILTERS.map(({ key, label }) => {
          const isActive = activeStage === key;
          const cfg = key !== "all" ? STAGE_CONFIG[key] : null;
          const count = key !== "all" ? stageCounts[key] : totalUsers;
          return (
            <StagePill
              key={key}
              isActive={isActive}
              count={count}
              label={label}
              color={cfg?.color}
              onClick={() => handleStageClick(key)}
            />
          );
        })}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {totalUsers > 0 && (
            <span className="text-[11px] text-white/25 font-mono tabular-nums">{totalUsers} leads</span>
          )}
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
        </div>
      </div>

      {/* ── User filter indicator ── */}
      {hasUserFilter && selectedUser && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg shrink-0"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: STAGE_CONFIG[selectedUser.stage].color }}
          />
          <span className="text-xs font-semibold text-white/80">
            {selectedUser.nickname || selectedUser.displayId}
          </span>
          <span className="text-[11px] text-white/30">{STAGE_EMOJI[selectedUser.stage]}</span>
          {selectedUser.keyAction && (
            <span className="text-[11px] text-white/30 truncate italic ml-1">
              &ldquo;{selectedUser.keyAction}&rdquo;
            </span>
          )}
          <button
            type="button"
            onClick={() => setSelectedUserId(null)}
            className="ml-auto text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            Todos los mensajes
          </button>
        </div>
      )}

      {/* ── Mobile: lead chips (horizontal scroll) ── */}
      {filteredLeads.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-2 shrink-0 no-scrollbar md:hidden">
          {filteredLeads.map((user) => (
            <LeadCard
              key={user.tiktokUserId}
              user={user}
              isSelected={selectedUserId === user.tiktokUserId}
              onToggleUser={() =>
                setSelectedUserId(
                  selectedUserId === user.tiktokUserId ? null : user.tiktokUserId,
                )
              }
              compact
            />
          ))}
        </div>
      )}

      {/* ── Desktop: lead column + chat ── */}
      <div className="flex-1 flex min-h-0 gap-3">
        {filteredLeads.length > 0 && (
          <div className="max-md:hidden w-56 shrink-0 overflow-y-auto space-y-0.5 pr-1">
            {filteredLeads.map((user) => (
              <LeadCard
                key={user.tiktokUserId}
                user={user}
                isSelected={selectedUserId === user.tiktokUserId}
                onToggleUser={() =>
                  setSelectedUserId(
                    selectedUserId === user.tiktokUserId ? null : user.tiktokUserId,
                  )
                }
              />
            ))}
          </div>
        )}

        {/* ── Chat ── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">
              Chat en vivo
              {selectedUser && (
                <span className="ml-2 text-white/40 normal-case tracking-normal">
                  · {selectedUser.nickname || selectedUser.displayId}
                </span>
              )}
            </h3>
            <span className="text-[11px] text-white/20 font-mono tabular-nums">
              {filteredMessages.length} msgs
            </span>
          </div>

          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto space-y-0.5 min-h-0 pr-1 scroll-smooth"
          >
            {filteredMessages.length === 0 ? (
              <p className="text-sm text-white/20 text-center py-16">
                {selectedUser
                  ? "Este usuario no ha enviado mensajes."
                  : activeStage !== "all"
                    ? "No hay mensajes de esta etapa aún."
                    : "Esperando mensajes..."}
              </p>
            ) : (
              filteredMessages.map((msg) => {
                const userStage = enriched.find(
                  (u) => u.tiktokUserId === msg.tiktokUserId,
                )?.stage;
                const cfg = userStage ? STAGE_CONFIG[userStage] : null;
                return (
                  <div
                    key={msg.id}
                    className="flex gap-2 p-2 rounded-lg transition-colors hover:bg-white/[0.02]"
                  >
                    {cfg && (
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: cfg.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span
                          className="font-semibold text-sm truncate"
                          style={{ color: cfg?.color ?? "#fff" }}
                        >
                          {msg.nickname || msg.displayId || "Anónimo"}
                        </span>
                        {msg.verified && (
                          <span className="text-[10px] text-blue-400 bg-blue-500/15 px-1 rounded-full font-medium leading-none">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/85 leading-relaxed break-words">
                        {msg.comment}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
