"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { LiveChat } from "./live-chat";
import { TopUsers } from "./top-users";

export function LiveController() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, "");
    if (!clean) return;

    setLoading(true);

    try {
      const res = await fetch("/api/lives/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean }),
      });
      const data = await res.json().catch(() => ({ raw: "respuesta no-JSON" }));

      if (res.ok) {
        const sessionId = data.live?.sessionId;
        if (sessionId) {
          setActiveSessionId(sessionId);
        }
        toast.success(`Live iniciado: @${clean}`);
      } else {
        toast.error(`Error al iniciar: ${data.message || res.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Fallo de red: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async (user: string) => {
    const clean = user.trim().replace(/^@/, "");
    if (!clean) {
      toast.error("Ingresa un username primero");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/lives/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean }),
      });
      const data = await res.json().catch(() => ({ raw: "respuesta no-JSON" }));

      if (res.ok) {
        toast.success(`Detenido: @${clean}`);
        setActiveSessionId(null);
      } else {
        toast.error(`Error al detener: ${data.message || res.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Fallo de red: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Iniciar listener</CardTitle>
          <CardDescription>
            El username se envía a <code className="text-xs bg-muted px-1.5 py-0.5 rounded">POST /lives/start</code> a través del proxy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStart} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="username" className="text-muted-foreground text-xs">
                Usuario de TikTok
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="ej. charlidamelio"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                className="h-12 text-base bg-background/50"
              />
            </div>
            <div className="flex gap-2 sm:items-end sm:pt-5">
              {!activeSessionId ? (
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 px-6 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white font-semibold"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Iniciar Live
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  className="h-12 px-5"
                  onClick={() => handleStop(username)}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Detener
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {activeSessionId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
            <CardContent className="pt-6">
              <LiveChat sessionId={activeSessionId} />
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
            <CardContent className="pt-6">
              <TopUsers sessionId={activeSessionId} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
