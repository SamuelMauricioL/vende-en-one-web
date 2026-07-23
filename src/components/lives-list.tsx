"use client";

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface LivesListProps {
  lives: unknown[];
  loading: boolean;
  onStop: (username: string) => void;
  onRefresh: () => void;
}

export function LivesList({ lives, loading, onStop, onRefresh }: LivesListProps) {
  useEffect(() => {
    onRefresh();
    const interval = setInterval(onRefresh, 10000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
            Lives activos
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {lives.length === 0 ? (
            <p className="text-muted-foreground text-sm py-2">
              {loading ? "Cargando…" : "No hay listeners activos."}
            </p>
          ) : (
            lives.map((l, i) => {
              const name =
                typeof l === "string" ? l : (l as Record<string, unknown>).username as string || "?";
              const initial = (name[0] || "?").toUpperCase();
              const sub =
                typeof l === "object"
                  ? JSON.stringify(l, null, 2)
                  : `escuchando @${name}`;

              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/30 p-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] flex items-center justify-center font-bold text-sm text-[var(--bg)] shrink-0 uppercase">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">@{name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {sub}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => onStop(name)}
                  >
                    Detener
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
