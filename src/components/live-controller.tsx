"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveChat } from "./live-chat";
import { TopUsers } from "./top-users";
import { trackEvent } from "@/lib/plausible";

const TIKTOK_URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.-]+)/;
const TIKTOK_HANDLE_REGEX = /^@?([a-zA-Z0-9_.-]+)$/;

function extractUsername(raw: string): string | null {
  const trimmed = raw.trim();

  // Try full URL first
  const urlMatch = trimmed.match(TIKTOK_URL_REGEX);
  if (urlMatch) return urlMatch[1];

  // Try bare handle (@username or username)
  const handleMatch = trimmed.match(TIKTOK_HANDLE_REGEX);
  if (handleMatch) return handleMatch[1];

  return null;
}

function validateInput(raw: string): { valid: boolean; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, error: "Ingresa un enlace o nombre de usuario" };

  const username = extractUsername(trimmed);
  if (!username) {
    return {
      valid: false,
      error: "No es un enlace de TikTok válido. Debe ser tipo tiktok.com/@usuario",
    };
  }

  if (username.length < 2) {
    return { valid: false, error: "El nombre de usuario es muy corto" };
  }

  if (username.length > 30) {
    return { valid: false, error: "El nombre de usuario es muy largo" };
  }

  return { valid: true };
}

export function LiveController() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [lastUsername, setLastUsername] = useState("");

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

    const validation = validateInput(input);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const username = extractUsername(input)!;
    setLastUsername(username);
    setLoading(true);

    try {
      const res = await fetch("/api/lives/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json().catch(() => ({ raw: "respuesta no-JSON" }));

      if (res.ok) {
        const sessionId = data.live?.sessionId;
        if (sessionId) {
          setActiveSessionId(sessionId);
        }
        trackEvent("Live Started", { username });
        toast.success(`Live iniciado: @${username}`);
      } else {
        trackEvent("Live Start Failed", { username, status: res.status });
        toast.error(`Error al iniciar: ${data.message || res.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Fallo de red: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!lastUsername) {
      toast.error("No hay un live activo");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/lives/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: lastUsername }),
      });
      const data = await res.json().catch(() => ({ raw: "respuesta no-JSON" }));

      if (res.ok) {
        trackEvent("Live Stopped", { username: lastUsername });
        toast.success(`Detenido: @${lastUsername}`);
        setActiveSessionId(null);
        setSelectedUserIds(new Set());
      } else {
        trackEvent("Live Stop Failed", { username: lastUsername, status: res.status });
        toast.error(`Error al detener: ${data.message || res.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Fallo de red: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const extracted = input.trim() ? extractUsername(input.trim()) : null;

  return (
    <div className="space-y-5">
      {/* Form */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p className="text-xs text-white/50 mb-4 leading-relaxed">
          Pega el enlace del perfil de TikTok del live que quieres monitorear.{" "}
          <span className="text-[#fe2c55] font-medium">
            ¡No pierdas ventas por TikTok Live!
          </span>
        </p>
        <form onSubmit={handleStart} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              id="tiktok-url"
              type="text"
              placeholder="https://www.tiktok.com/@tiktok"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              className="h-11 text-sm bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 focus-visible:ring-[#fe2c55]/50"
              disabled={!!activeSessionId}
            />
            {/* Extracted username hint */}
            {input.trim() && extracted && !activeSessionId && (
              <p className="mt-1.5 text-[11px] text-white/20 font-mono">
                @{extracted}
              </p>
            )}
            {input.trim() && !extracted && !activeSessionId && (
              <p className="mt-1.5 text-[11px] text-[#fe2c55]/60">
                Enlace no válido — debe ser tiktok.com/@usuario
              </p>
            )}
          </div>
          <div className="flex gap-2 sm:self-end">
            {!activeSessionId ? (
              <Button
                type="submit"
                disabled={loading || !extracted}
                className="h-11 px-6 bg-[#fe2c55] hover:bg-[#fe2c55]/80 text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#fe2c55]/25 disabled:opacity-40"
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
                onClick={handleStop}
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
          <div className="lg:col-span-3 lg:order-last rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <LiveChat sessionId={activeSessionId} selectedUserIds={selectedUserIds} />
          </div>
          <div className="lg:col-span-2 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <TopUsers sessionId={activeSessionId} selectedUserIds={selectedUserIds} onToggleUser={toggleUser} />
          </div>
        </div>
      )}
    </div>
  );
}
