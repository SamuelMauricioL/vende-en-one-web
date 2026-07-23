"use client";

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
}

export function LiveChat({ sessionId }: LiveChatProps) {
  const { data: messages, connected } = useSSE<ChatMessage>(
    `/api/lives/${sessionId}/chat/stream`,
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Chat en vivo</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {messages?.length ?? 0} mensajes
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-2">
        {!messages || messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {connected ? "Esperando mensajes..." : "Conectando..."}
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="flex gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {msg.nickname || msg.displayId || "Anónimo"}
                  </span>
                  {msg.verified && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                      ✓
                    </span>
                  )}
                  {msg.followerCount && (
                    <span className="text-xs text-muted-foreground">
                      {msg.followerCount} seguidores
                    </span>
                  )}
                </div>
                <p className="text-sm break-words">{msg.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
