"use client";

import { useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import { Dialog, DialogHeader, DialogBody } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface TopUser {
  tiktokUserId: string;
  displayId?: string;
  nickname?: string;
  verified?: boolean;
  followerCount?: string;
  entries: number;
  comments: number;
  commentTexts: string[];
  score: number;
}

interface TopUsersProps {
  sessionId: string;
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

export function TopUsers({ sessionId }: TopUsersProps) {
  const { data: users, connected } = useSSE<TopUser>(
    `/api/lives/${sessionId}/stats/stream`,
  );
  const [selectedUser, setSelectedUser] = useState<TopUser | null>(null);

  return (
    <>
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

              return (
                <button
                  key={user.tiktokUserId}
                  type="button"
                  onClick={() => setSelectedUser(user)}
                  className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
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
                      <span title="Veces que ingresó al live">{user.entries} ingresos</span>
                      <span>{user.comments} comentarios</span>
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

      {/* User messages dialog */}
      <Dialog open={!!selectedUser} onClose={() => setSelectedUser(null)}>
        {selectedUser && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-sm"
                  style={{ color: getUserColor(selectedUser.tiktokUserId) }}
                >
                  {selectedUser.nickname || selectedUser.displayId || "Anónimo"}
                </span>
                {selectedUser.verified && (
                  <span className="text-blue-400 text-xs">✓</span>
                )}
                <span className="text-xs text-white/30 ml-1">
                  · {selectedUser.comments} mensajes
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>

            {selectedUser.followerCount && (
              <div className="px-5 pt-3 pb-0 text-[11px] text-white/30">
                {selectedUser.followerCount} seguidores · score {selectedUser.score} · {selectedUser.entries} entradas
              </div>
            )}

            <DialogBody>
              {selectedUser.commentTexts.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">
                  Este usuario no ha enviado mensajes.
                </p>
              ) : (
                selectedUser.commentTexts.map((text, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/5 text-sm text-white/80 leading-relaxed break-words"
                  >
                    {text}
                  </div>
                ))
              )}
            </DialogBody>
          </>
        )}
      </Dialog>
    </>
  );
}
