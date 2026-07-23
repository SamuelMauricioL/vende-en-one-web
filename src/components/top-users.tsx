"use client";

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
  score: number;
}

interface TopUsersProps {
  sessionId: string;
}

export function TopUsers({ sessionId }: TopUsersProps) {
  const { data: users, connected } = useSSE<TopUser>(
    `/api/lives/${sessionId}/stats/stream`,
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Usuarios top</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {users?.length ?? 0} usuarios
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-2">
        {!users || users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {connected ? "Esperando usuarios..." : "Conectando..."}
          </p>
        ) : (
          users.map((user, index) => (
            <div
              key={user.tiktokUserId}
              className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white font-bold text-sm">
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {user.nickname || user.displayId || "Anónimo"}
                  </span>
                  {user.verified && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                      ✓
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span>Entradas: {user.entries}</span>
                  <span>Comentarios: {user.comments}</span>
                  {user.followerCount && (
                    <span>{user.followerCount} seguidores</span>
                  )}
                </div>

                {user.commentTexts.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Intereses:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.commentTexts.slice(0, 3).map((text, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full bg-background/50 border border-border/50 truncate max-w-[150px]"
                          title={text}
                        >
                          {text}
                        </span>
                      ))}
                      {user.commentTexts.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-background/50 border border-border/50">
                          +{user.commentTexts.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
