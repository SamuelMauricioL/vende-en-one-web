"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import {
  classifyLead,
  STAGE_CONFIG,
  STAGE_ORDER,
  type LeadStage,
} from "@/lib/lead-classifier";
import { useEffect } from "react";

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

type EnrichedUser = (LiveSessionSummary["topUsers"][number]) & {
  stage: LeadStage;
  keyAction: string | null;
};

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

function durationStr(start: number, end?: number): string {
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

const STAGE_FILTERS: { key: "all" | LeadStage; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "compra", label: "Compra" },
  { key: "negociando", label: "Negociando" },
  { key: "interesado", label: "Interesado" },
];

/* ── Enrich users with stage classification ── */

function enrichUsers(users: LiveSessionSummary["topUsers"]): EnrichedUser[] {
  return users
    .map((u) => {
      const result = classifyLead(u.commentTexts);
      if (!result) return null;
      return { ...u, ...result };
    })
    .filter(Boolean) as EnrichedUser[];
}

function getStageCounts(users: EnrichedUser[]): Record<LeadStage, number> {
  const counts = { compra: 0, negociando: 0, interesado: 0 };
  for (const u of users) counts[u.stage]++;
  return counts;
}

/* ── Copy helpers ── */

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  } catch {
    toast.error("No se pudo copiar");
  }
}

/* ── Component ── */

export default function HistoryPageClient({
  initialUsername: defaultUsername,
}: {
  initialUsername?: string;
}) {
  const [username, setUsername] = useState(defaultUsername ?? "");
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const { userId, isLoaded: authLoaded } = useAuth();

  // Auto-fetch TikTok username from user profile
  useEffect(() => {
    if (!authLoaded || !userId || defaultUsername) return;
    fetch(`/api/users/profile/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const stored = data?.profile?.tiktokUsername;
        if (stored && !defaultUsername) {
          setUsername(stored);
          fetchHistory(stored);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoaded]);

  const fetchHistory = useCallback(async (u: string) => {
    if (!u.trim()) return;
    setLoading(true);
    setLoaded(false);
    try {
      const res = await fetch(
        `/api/lives/history/${encodeURIComponent(u.trim())}`,
      );
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
    if (defaultUsername) fetchHistory(defaultUsername);
    else setLoaded(true);
  }, [defaultUsername, fetchHistory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    if (!u) return;
    window.history.pushState(null, "", `/app/history?username=${encodeURIComponent(u)}`);
    fetchHistory(u);
  };

  const sessionsWithSummary = sessions.filter((s) => s.summary && s.status !== "error");
  const totalLeads = sessionsWithSummary.reduce(
    (acc, s) => acc + (s.summary?.topUsers?.length ?? 0),
    0,
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      <AppNav current="history" />

      {/* Search */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 pb-2">
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
            className="h-11 px-6 bg-[#fe2c55] hover:bg-[#fe2c55]/80 text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#fe2c55]/25 disabled:opacity-40 transition-all shrink-0"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pb-8">
        {/* Stats bar */}
        {sessions.length > 0 && (
          <div className="flex items-center gap-3 py-3 text-xs text-white/30">
            <span className="font-mono tabular-nums">{sessions.length} sesiones</span>
            <span className="text-white/10">·</span>
            <span className="font-mono tabular-nums">{totalLeads} leads</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && loaded && sessions.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-white/30">
              {username
                ? "No se encontraron sesiones para este usuario"
                : "Busca un usuario de TikTok para ver su historial"}
            </p>
            {username && (
              <p className="text-xs text-white/20 mt-2">
                Asegúrate de haber monitoreado sus lives con Live Leads
              </p>
            )}
          </div>
        )}

        {/* Session list */}
        {!loading && (
          <div className="space-y-2.5">
            {sessions.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                isExpanded={expandedSession === session._id}
                onToggle={() =>
                  setExpandedSession(
                    expandedSession === session._id ? null : session._id,
                  )
                }
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/[0.04] py-3 shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[10px] text-white/20">
            Live Leads &copy; {new Date().getFullYear()}
          </span>
        </div>
      </footer>

      <Toaster richColors position="bottom-center" />
    </div>
  );
}

/* ── Session card ── */

function SessionCard({
  session,
  isExpanded,
  onToggle,
}: {
  session: HistorySession;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const status = statusLabel(session.status);
  const hasSummary = !!session.summary;

  const enriched = useMemo(
    () => (session.summary ? enrichUsers(session.summary.topUsers) : []),
    [session.summary],
  );

  const stageCounts = useMemo(() => getStageCounts(enriched), [enriched]);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Header ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: status.color }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white/80 truncate">
                @{session.username}
              </span>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  backgroundColor: `${status.color}15`,
                  color: status.color,
                }}
              >
                {status.text}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/25 mt-0.5">
              <span>{formatDate(session.startedAt)} · {formatTime(session.startedAt)}</span>
              <span>·</span>
              <span>{durationStr(session.startedAt, session.endedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasSummary && enriched.length > 0 && (
            <div className="flex items-center gap-1.5">
              {STAGE_ORDER.filter((stage) => stageCounts[stage] > 0).map((stage) => {
                const count = stageCounts[stage];
                const cfg = STAGE_CONFIG[stage];
                return (
                  <span
                    key={stage}
                    className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${cfg.color}12`,
                      color: cfg.color,
                    }}
                  >
                    {cfg.label} {count}
                  </span>
                );
              })}
            </div>
          )}
          <span className="text-xs text-white/25 font-mono tabular-nums">
            {enriched.length} leads
          </span>
          <svg
            className={`w-3.5 h-3.5 text-white/25 transition-transform duration-200 ${
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

      {/* ── Expanded content ── */}
      {isExpanded && hasSummary && enriched.length > 0 && (
        <SessionDetail enriched={enriched} />
      )}
      {isExpanded && !hasSummary && (
        <div className="px-4 pb-4">
          <p className="text-xs text-white/25">
            Esta sesión no tiene datos de leads guardados.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Session detail (expanded leads) ── */

function SessionDetail({ enriched }: { enriched: EnrichedUser[] }) {
  const [stageFilter, setStageFilter] = useState<"all" | LeadStage>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const stageCounts = useMemo(() => getStageCounts(enriched), [enriched]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (stageFilter !== "all") {
      list = list.filter((u) => u.stage === stageFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          (u.nickname?.toLowerCase() ?? "").includes(q) ||
          (u.displayId?.toLowerCase() ?? "").includes(q),
      );
    }
    return list;
  }, [enriched, stageFilter, searchQuery]);

  return (
    <div className="px-4 pb-4 space-y-3">
      {/* Stage pills + search */}
      <div className="flex items-center gap-2 flex-wrap">
        {STAGE_FILTERS.map(({ key, label }) => {
          const isActive = stageFilter === key;
          const cfg = key !== "all" ? STAGE_CONFIG[key] : null;
          const count = key !== "all" ? stageCounts[key] : enriched.length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStageFilter(key)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200"
              style={{
                backgroundColor: isActive
                  ? cfg ? `${cfg.color}20` : "rgba(255,255,255,0.1)"
                  : "rgba(255,255,255,0.04)",
                color: isActive
                  ? cfg ? cfg.color : "rgba(255,255,255,0.8)"
                  : "rgba(255,255,255,0.35)",
              }}
            >
              <span className="font-mono tabular-nums">{count}</span>
              <span>{label}</span>
            </button>
          );
        })}

        {/* Lead search */}
        {enriched.length > 5 && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar lead..."
            className="ml-auto h-7 w-32 text-[11px] px-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        )}
      </div>

      {/* Lead list */}
      <div className="space-y-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-white/20 text-center py-6">
            {searchQuery
              ? "No hay leads que coincidan con la búsqueda"
              : "No hay leads en esta etapa"}
          </p>
        ) : (
          filtered.map((user) => (
            <LeadRow key={user.tiktokUserId} user={user} />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Lead row ── */

function LeadRow({ user }: { user: EnrichedUser }) {
  const cfg = STAGE_CONFIG[user.stage];
  const displayName = user.nickname || user.displayId || "Anónimo";

  const copyToDM = () => {
    copyText(`@${displayName}`, "Usuario");
  };

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.02]"
      style={{
        borderLeft: `3px solid ${cfg.color}`,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      {/* Stage dot — same style as live view */}
      <span
        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
        style={{ backgroundColor: cfg.color }}
      />

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold truncate max-w-[200px] sm:max-w-none"
            style={{ color: cfg.color }}
          >
            {displayName}
          </span>
          <span className="text-[10px] text-white/20 shrink-0 font-mono tabular-nums">
            {user.comments} msgs
          </span>
        </div>
        {user.keyAction && (
          <p className="text-xs text-white/40 leading-relaxed truncate italic mt-0.5">
            &ldquo;{user.keyAction}&rdquo;
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={copyToDM}
          title="Copiar @usuario para escribirle al DM"
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg transition-all duration-200 text-xs font-medium"
          style={{
            backgroundColor: `${cfg.color}12`,
            color: cfg.color,
            border: `1px solid ${cfg.color}25`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${cfg.color}20`; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${cfg.color}12`; }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          Escribirle al DM
        </button>
      </div>
    </div>
  );
}
