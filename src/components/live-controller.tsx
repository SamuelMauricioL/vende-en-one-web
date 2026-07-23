"use client";

import { useState, useCallback } from "react";
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
import { StatusPanel } from "./status-panel";
import { LivesList } from "./lives-list";

export type StatusKind = "" | "ok" | "warn" | "err";

export interface StatusState {
  text: string;
  kind: StatusKind;
}

export function LiveController() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    text: "Sin actividad todavía.",
    kind: "",
  });
  const [lives, setLives] = useState<unknown[]>([]);
  const [livesLoading, setLivesLoading] = useState(false);

  const refreshLives = useCallback(async () => {
    setLivesLoading(true);
    try {
      const res = await fetch("/api/lives");
      const data = await res.json().catch(() => ({}));
      setLives(Array.isArray(data.lives) ? data.lives : []);
    } catch {
      setLives([]);
    } finally {
      setLivesLoading(false);
    }
  }, []);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, "");
    if (!clean) return;

    setLoading(true);
    setStatus({ text: "Enviando POST /lives/start…", kind: "warn" });

    try {
      const res = await fetch("/api/lives/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean }),
      });
      const data = await res.json().catch(() => ({ raw: "respuesta no-JSON" }));

      if (res.ok) {
        setStatus({
          text: `Live iniciado para @${clean}`,
          kind: "ok",
        });
        toast.success(`Live iniciado: @${clean}`);
      } else {
        setStatus({
          text: `Error (${res.status}): ${JSON.stringify(data, null, 2)}`,
          kind: "err",
        });
        toast.error(`Error al iniciar: ${data.message || res.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setStatus({ text: `Fallo de red: ${msg}`, kind: "err" });
      toast.error(`Fallo de red: ${msg}`);
    } finally {
      setLoading(false);
      refreshLives();
    }
  };

  const handleStop = async (user: string) => {
    const clean = user.trim().replace(/^@/, "");
    if (!clean) {
      toast.error("Ingresa un username primero");
      return;
    }

    setLoading(true);
    setStatus({ text: "Deteniendo…", kind: "warn" });

    try {
      const res = await fetch("/api/lives/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean }),
      });
      const data = await res.json().catch(() => ({ raw: "respuesta no-JSON" }));

      if (res.ok) {
        setStatus({ text: `Detenido @${clean}`, kind: "ok" });
        toast.success(`Detenido: @${clean}`);
      } else {
        setStatus({
          text: `Error (${res.status}): ${JSON.stringify(data, null, 2)}`,
          kind: "err",
        });
        toast.error(`Error al detener: ${data.message || res.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setStatus({ text: `Fallo de red: ${msg}`, kind: "err" });
    } finally {
      setLoading(false);
      refreshLives();
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
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-6 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white font-semibold"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Live
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="h-12 px-5"
                onClick={() => handleStop(username)}
              >
                Detener
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatusPanel status={status} />
        <LivesList
          lives={lives}
          loading={livesLoading}
          onStop={handleStop}
          onRefresh={refreshLives}
        />
      </div>
    </div>
  );
}
