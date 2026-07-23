"use client";

import { useEffect, useState } from "react";
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

const USER_COLORS = [
  "#ff0050", "#00f2ea", "#ff6b35", "#ffd700",
  "#ff69b4", "#7c3aed", "#06d6a0", "#f72585",
  "#4cc9f0", "#e63946", "#2ec4b6", "#ff9f1c",
  "#b5179e", "#4361ee", "#f77f00", "#80ed99",
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

const TOP_MEDALS = ["🥇", "🥈", "🥉"];

export function TopUsers({ sessionId, selectedUserIds, onToggleUser }: TopUsersProps) {
  const { data: users, connected } = useSSE<TopUser>(
    `/api/lives/${sessionId}/stats/stream`,
  );
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  function formatDuration(ms: number): string {
    const totalMin = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    if (totalMin >= 60) {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${h}h ${m}m`;
    }
    return `${totalMin}m ${sec}s`;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/80">Usuarios top</h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} />
          <span className="text-xs text-white/40">{users?.length ?? 0} usuarios</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[520px] pr-1">
        {!users || users.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-12">
            {connected ? "Esperando usuarios..." : "Conectando..."}
          </p>
        ) : (
          users.map((user, index) => {
            const color = getUserColor(user.tiktokUserId);
            const maxScore = users[0]?.score || 1;
            const barWidth = (user.score / maxScore) * 100;
            const isSelected = selectedUserIds.has(user.tiktokUserId);

            return (
              <button
                key={user.tiktokUserId}
                type="button"
                onClick={() => onToggleUser(user.tiktokUserId)}
                className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-white/15 ring-1 ring-white/20"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-center w-7 h-7 shrink-0">
                  {index < 3 ? (
                    <span className="text-lg">{TOP_MEDALS[index]}</span>
                  ) : (
                    <span className="text-xs font-bold text-white/30">#{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-semibold text-sm truncate" style={{ color }}>
                      {user.nickname || user.displayId || "Anónimo"}
                    </span>
                    {user.verified && (
                      <span className="text-blue-400 text-xs">✓</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-white/40">
                    <span>{user.entries <= 1 ? "primer live!" : `${user.entries} ingresos al live`}</span>
                    <span>{user.comments} comentarios</span>
                    {user.firstSeen && (
                      <span>{formatDuration(Date.now() - user.firstSeen)} en live</span>
                    )}
                  </div>

                  <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%`, backgroundColor: color }}
                    />
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
