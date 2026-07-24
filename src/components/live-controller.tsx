"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveChat } from "./live-chat";
import { TopUsers } from "./top-users";
import { trackEvent } from "@/lib/plausible";

export function LiveController() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const toggleUser = useCallback((userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

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
        trackEvent("Live Started", { username: clean });
        toast.success(`Live iniciado: @${clean}`);
      } else {
        trackEvent("Live Start Failed", { username: clean, status: res.status });
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
        trackEvent("Live Stopped", { username: clean });
        toast.success(`Detenido: @${clean}`);
        setActiveSessionId(null);
        setSelectedUserIds(new Set());
      } else {
        trackEvent("Live Stop Failed", { username: clean, status: res.status });
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
    <div className="space-y-5">
      {/* TikTok-style compact form */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4">
        <p className="text-xs text-white/50 mb-3 leading-relaxed">
          Escribe el nombre de usuario de TikTok del live que quieres monitorear. <span className="text-[#fe2c55] font-medium">¡No pierdas ventas por TikTok Live!</span>
        </p>
        <form onSubmit={handleStart} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              id="username"
              type="text"
              placeholder="ej. usuario_tiktok"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              className="h-11 text-sm bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 focus-visible:ring-[#fe2c55]/50"
              disabled={!!activeSessionId}
            />
          </div>
          <div className="flex gap-2 sm:self-end">
            {!activeSessionId ? (
              <Button
                type="submit"
                disabled={loading}
                className="h-11 px-6 bg-[#fe2c55] hover:bg-[#fe2c55]/80 text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#fe2c55]/25"
              >
                {loading && (
                  <span className="mr-2 h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                {loading ? "Conectando..." : "Iniciar Live"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="h-11 px-6 border-white/20 text-white/80 hover:bg-white/10 rounded-xl text-sm"
                onClick={() => handleStop(username)}
              >
                {loading ? (
                  <span className="mr-2 h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : null}
                {loading ? "Deteniendo..." : "Detener Live"}
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Live panels */}
      {activeSessionId && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 lg:order-last rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4">
            <LiveChat sessionId={activeSessionId} selectedUserIds={selectedUserIds} />
          </div>
          <div className="lg:col-span-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4">
            <TopUsers sessionId={activeSessionId} selectedUserIds={selectedUserIds} onToggleUser={toggleUser} />
          </div>
        </div>
      )}
    </div>
  );
}
