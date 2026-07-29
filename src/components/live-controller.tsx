"use client";

import { useCallback, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveDashboard } from "./LiveDashboard";
import { trackEvent } from "@/lib/plausible";

const TIKTOK_URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.-]+)/;
const TIKTOK_HANDLE_REGEX = /^@?([a-zA-Z0-9_.-]+)$/;

function extractUsername(raw: string): string | null {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(TIKTOK_URL_REGEX);
  if (urlMatch) return urlMatch[1];
  const handleMatch = trimmed.match(TIKTOK_HANDLE_REGEX);
  if (handleMatch) return handleMatch[1];
  return null;
}

function validateInput(raw: string): { valid: boolean; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, error: "Ingresa un enlace o nombre de usuario" };
  const username = extractUsername(trimmed);
  if (!username) {
    return { valid: false, error: "Debe ser tiktok.com/@usuario o @usuario" };
  }
  if (username.length < 2) return { valid: false, error: "El nombre de usuario es muy corto" };
  if (username.length > 30) return { valid: false, error: "El nombre de usuario es muy largo" };
  return { valid: true };
}

export interface LiveControllerHandle {
  handleStop: () => Promise<void>;
  active: boolean;
  loading: boolean;
}

export const LiveController = forwardRef<
  LiveControllerHandle,
  { onActiveChange?: (active: boolean) => void; initialTikTokUsername?: string }
>(({ onActiveChange, initialTikTokUsername = "" }, ref) => {
  const [input, setInput] = useState(
    initialTikTokUsername ? `https://www.tiktok.com/@${initialTikTokUsername}` : "",
  );
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [lastUsername, setLastUsername] = useState(initialTikTokUsername);

  const handleConnectionError = useCallback((error: string) => {
    toast.error(`Error al conectar: ${error}`);
    setActiveSessionId(null);
    setLastUsername("");
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      handleStop,
      active: !!activeSessionId,
      loading,
    }),
    [activeSessionId, loading],
  );

  useEffect(() => {
    onActiveChange?.(!!activeSessionId);
  }, [activeSessionId, onActiveChange]);

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

  /* ── Render ── */

  if (!activeSessionId) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div
          className="w-full max-w-md rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #fe2c55, #e8254a)",
              }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white/80">Monitorear Live</h2>
              <p className="text-[11px] text-white/30">
                Pega el enlace del perfil TikTok
              </p>
            </div>
          </div>

          <form onSubmit={handleStart} className="space-y-3">
            <Input
              id="tiktok-url"
              type="text"
              placeholder="https://www.tiktok.com/@usuario"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              className="h-12 text-sm bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 focus-visible:ring-[#fe2c55]/50"
            />
            {input.trim() && extracted && (
              <p className="text-[11px] text-white/20 font-mono text-center">
                @{extracted}
              </p>
            )}
            {input.trim() && !extracted && (
              <p className="text-[11px] text-[#fe2c55]/60 text-center">
                Enlace no válido — debe ser tiktok.com/@usuario
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !extracted}
              className="w-full h-12 bg-[#fe2c55] hover:bg-[#fe2c55]/80 text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#fe2c55]/25 disabled:opacity-40 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Conectando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  </svg>
                  Iniciar live
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-xs text-white/15 text-center mt-6 max-w-sm leading-relaxed">
          <span className="text-[#fe2c55] font-medium">¡No pierdas ventas!</span>{" "}
          Captura leads de tu TikTok Live en tiempo real.{" "}
          <span className="text-white/20">97% de precisión en detección de compra.</span>
        </p>
      </div>
    );
  }

  /* ── Live activo ── */
  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header: stop button (mobile hidden — AppNav handles it) */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] shrink-0"
          />
          <span className="text-xs text-white/40 truncate font-mono">
            @{lastUsername}
          </span>
        </div>
        <button
          type="button"
          onClick={handleStop}
          disabled={loading}
          className="h-8 px-3 border border-white/15 text-white/50 hover:text-white/80 hover:border-white/30 rounded-lg text-xs font-medium transition-all disabled:opacity-40 shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Deteniendo...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
              Detener
            </span>
          )}
        </button>
      </div>

      {/* LiveDashboard */}
      <div className="flex-1 min-h-0">
        <LiveDashboard sessionId={activeSessionId} onConnectionError={handleConnectionError} />
      </div>
    </div>
  );
});
