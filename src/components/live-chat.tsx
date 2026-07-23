"use client";

import { useEffect, useRef } from "react";
import { useSSE } from "@/hooks/useSSE";

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

interface LiveChatProps {
  sessionId: string;
  selectedUserIds: Set<string>;
}

const USER_COLORS = [
  "#ff0050", "#00f2ea", "#ff6b35", "#ffd700",
  "#ff69b4", "#7c3aed", "#06d6a0", "#f72585",
  "#4cc9f0", "#e63946", "#2ec4b6", "#ff9f1c",
  "#b5179e", "#4361ee", "#f77f00", "#80ed99",
];

function getUserColor(userId: string | undefined): string {
  if (!userId) return "#fff";
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function LiveChat({ sessionId, selectedUserIds }: LiveChatProps) {
  const { data: messages, connected } = useSSE<ChatMessage>(
    `/api/lives/${sessionId}/chat/stream`,
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const isFiltered = selectedUserIds.size > 0;
  const filtered = messages?.filter(
    (m) => !isFiltered || (m.tiktokUserId && selectedUserIds.has(m.tiktokUserId)),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [filtered?.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/80">
          Chat en vivo
          {isFiltered && (
            <span className="ml-2 text-[11px] font-normal text-white/40">
              · filtrado
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} />
          <span className="text-xs text-white/40">{filtered?.length ?? 0} mensajes</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-[520px] pr-1 scroll-smooth">
        {!filtered || filtered.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-12">
            {connected
              ? isFiltered
                ? "Este usuario no ha enviado mensajes."
                : "Esperando mensajes..."
              : "Conectando..."}
          </p>
        ) : (
          filtered.map((msg) => {
            const color = getUserColor(msg.tiktokUserId);
            return (
              <div
                key={msg.id}
                className="flex gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="font-semibold text-sm truncate" style={{ color }}>
                      {msg.nickname || msg.displayId || "Anónimo"}
                    </span>
                    {msg.verified && (
                      <span className="text-[11px] leading-none text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded-full font-medium">
                        ✓ Verificado
                      </span>
                    )}
                    {msg.followerCount && (
                      <span className="text-[11px] text-white/30">{msg.followerCount} seguidores</span>
                    )}
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed break-words">{msg.comment}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
