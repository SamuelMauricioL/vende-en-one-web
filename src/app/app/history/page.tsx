"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthButton } from "@/components/auth/auth-button";
import { Toaster } from "@/components/ui/sonner";
import {
  classifyLead,
  getKeyAction,
  getStageIndex,
  STAGE_CONFIG,
  STAGE_ORDER,
  type LeadStage,
} from "@/lib/lead-classifier";

/* ── Types matching Convex response ── */

interface LiveSessionSummary {
  sessionId: string;
  username: string;
  endedAt: number;
  totalUsers: number;
  totalMessages: number;
  topUsers: Array<{
    tiktokUserId: string;
    displayId?: string;
    nickname?: string;
    verified?: boolean;
    followerCount?: string;
    entries: number;
    comments: number;
    commentTexts: string[];
    firstSeen?: number;
    score: number;
  }>;
  chat: Array<{
    id: string;
    tiktokUserId?: string;
    displayId?: string;
    nickname?: string;
    verified?: boolean;
    followerCount?: string;
    comment: string;
    createdAt: number;
  }>;
}

interface HistorySession {
  _id: string;
  _creationTime: number;
  username: string;
  status: string;
  startedAt: number;
  endedAt?: number;
  roomId?: string;
  error?: string;
  summary: LiveSessionSummary | null;
}

/* ── Helpers ── */

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function durationMs(start: number, end?: number): string {
  const ms = (end ?? Date.now()) - start;
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}min`;
}

function statusLabel(status: string): { text: string; color: string } {
  const map: Record<string, { text: string; color: string }> = {
    ended: { text: "Finalizado", color: "#4ade80" },
    stopped: { text: "Detenido", color: "#facc15" },
    error: { text: "Error", color: "#fe2c55" },
    live: { text: "En vivo", color: "#25f4ee" },
  };
  return map[status] ?? { text: status, color: "#fff" };
}

/* ── Component ── */

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialUsername = searchParams.get("username") || "";
  const [username, setUsername] = useState(initialUsername);
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const fetchHistory = useCallback(async (u: string) => {
    if (!u.trim()) return;
    setLoading(true);
    setLoaded(false);
    try {
      const res = await fetch(`/api/lives/history/${encodeURIComponent(u.trim())}`);
      const data = await res.json();
      const list: HistorySession[] = data.sessions ?? [];
      setSessions(list);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (initialUsername) fetchHistory(initialUsername);
    else setLoaded(true);
  }, [initialUsername, fetchHistory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    if (!u) return;
    router.push(`/app/history?username=${encodeURIComponent(u)}`);
    fetchHistory(u);
  };

  const allSessionsExpanded = sessions.filter((s) => s.summary);
  const totalLeads = allSessionsExpanded.reduce(
    (acc, s) => acc + (s.summary?.topUsers?.length ?? 0),
    0,
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-white/[0.04]"
        style={{ backgroundColor: "#0b0f1a" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/app"
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 hover:bg-white/5 active:scale-95"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              aria-label="Volver"
            >
              <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <h1 className="text-lg font-extrabold text-white/90 tracking-tight">
              Historial
            </h1>
          </div>
          <AuthButton variant="app" />
        </div>
      </header>

      {/* Search */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6 pb-2">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario de TikTok (ej: gatyetperu1)"
            className="flex-1 h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/50"
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="h-11 px-6 bg-[#fe2c55] hover:bg-[#fe2c55]/80 text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#fe2c55]/25 disabled:opacity-40 transition-all"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-8">
        {/* Summary bar */}
        {sessions.length > 0 && (
          <div className="flex items-center gap-4 py-3 text-xs text-white/40">
            <span>{sessions.length} sesiones</span>
            <span className="text-white/10">·</span>
            <span>{totalLeads} leads capturados</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
          </div>
        )}

        {!loading && loaded && sessions.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/40 text-sm">
              {username
                ? "No se encontraron sesiones para este usuario"
                : "Ingresa un usuario de TikTok para ver su historial"}
            </p>
          </div>
        )}

        {!loading && (
          <div className="space-y-3">
            {sessions.map((session) => {
              const status = statusLabel(session.status);
              const hasSummary = !!session.summary;
              const isExpanded = expandedSession === session._id;

              return (
                <div
                  key={session._id}
                  className="rounded-2xl overflow-hidden transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Session header — always visible */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSession(isExpanded ? null : session._id)
                    }
                    className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: status.color }}
                      />
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-white/80">
                          @{session.username}
                        </span>
                        <span className="text-xs text-white/30 ml-2">
                          {formatDate(session.startedAt)} · {formatTime(session.startedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${status.color}15`,
                          color: status.color,
                        }}
                      >
                        {status.text}
                      </span>
                      <span className="text-xs text-white/30">
                        {durationMs(session.startedAt, session.endedAt)}
                      </span>
                      {hasSummary && (
                        <span className="text-xs text-white/30">
                          {session.summary!.totalUsers} leads
                        </span>
                      )}
                      <svg
                        className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && hasSummary && (
                    <SessionDetail session={session} />
                  )}
                  {isExpanded && !hasSummary && (
                    <div className="px-4 pb-4">
                      <p className="text-xs text-white/30">
                        Esta sesión no tiene datos de leads guardados.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-white/[0.04] py-3 shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[10px] text-white/20">
            Live Leads &copy; {new Date().getFullYear()}
          </span>
        </div>
      </footer>

      <Toaster richColors position="bottom-center" />
    </div>
  );
}

/* ── Session detail (expanded leads) ── */

function SessionDetail({ session }: { session: HistorySession }) {
  const summary = session.summary!;
  const enriched = summary.topUsers
    .map((u) => {
      const stage = classifyLead(u.commentTexts);
      if (!stage) return null;
      return { ...u, stage, keyAction: getKeyAction(u.commentTexts) };
    })
    .filter(Boolean) as Array<
    (typeof summary.topUsers)[number] & {
      stage: LeadStage;
      keyAction: string | null;
    }
  >;

  const grouped: Record<LeadStage, typeof enriched> = {
    interesado: [],
    negociando: [],
    compra: [],
  };
  for (const u of enriched) {
    if (grouped[u.stage]) grouped[u.stage].push(u);
  }

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Mini funnel */}
      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="p-3">
          <div className="flex flex-col items-center gap-1">
            {STAGE_ORDER.map((stage) => {
              const count = grouped[stage].length;
              const cfg = STAGE_CONFIG[stage];
              const maxCount = Math.max(
                ...STAGE_ORDER.map((s) => grouped[s].length),
                1,
              );
              const pctWidth =
                stage === "compra" ? 15 : stage === "negociando" ? 40 : 75;
              const barHeight = Math.max(
                6,
                count === 0 ? 4 : (count / maxCount) * 20,
              );

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
                          width:
                            count === 0
                              ? "0%"
                              : `${Math.max(5, (count / maxCount) * 100)}%`,
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

      {/* Lead list */}
      <div className="space-y-1">
        {enriched.map((user) => {
          const cfg = STAGE_CONFIG[user.stage];
          const stageIndex = getStageIndex(user.stage);
          return (
            <div
              key={user.tiktokUserId}
              className="rounded-xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderLeft: `3px solid ${cfg.color}`,
              }}
            >
              {/* Stage progress */}
              <div className="flex h-0.5 w-full bg-white/[0.03]">
                {STAGE_ORDER.map((s, i) => (
                  <div
                    key={s}
                    className="h-full transition-all duration-300"
                    style={{
                      flex: 1,
                      backgroundColor:
                        i <= stageIndex ? STAGE_CONFIG[s].color : "transparent",
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
                      boxShadow:
                        user.stage === "compra"
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
                    </div>

                    {user.keyAction && (
                      <p className="text-xs text-white/50 leading-relaxed line-clamp-1 italic">
                        &ldquo;{user.keyAction}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {enriched.length === 0 && (
          <p className="text-xs text-white/30 text-center py-4">
            Sin leads en esta sesión
          </p>
        )}
      </div>
    </div>
  );
}
