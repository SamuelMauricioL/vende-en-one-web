"use client";

import { useCallback, useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopUsers } from "./top-users";
import { LiveChat } from "./live-chat";
import { LeadsMobile } from "./LeadsMobile";
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

export interface LiveControllerHandle {
  handleStop: () => Promise<void>;
  active: boolean;
  loading: boolean;
}

export const LiveController = forwardRef<LiveControllerHandle, { onActiveChange?: (active: boolean) => void; initialTikTokUsername?: string }>(({ onActiveChange, initialTikTokUsername = "" }, ref) => {
  const [input, setInput] = useState(initialTikTokUsername ? `https://www.tiktok.com/@${initialTikTokUsername}` : "");
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [attendedUserIds, setAttendedUserIds] = useState<Set<string>>(new Set());
  const [lastUsername, setLastUsername] = useState(initialTikTokUsername);
  const [showEditInput, setShowEditInput] = useState(false);

  const handleConnectionError = useCallback((error: string) => {
    toast.error(`Error al conectar: ${error}`);
    setActiveSessionId(null);
    setSelectedUserIds(new Set());
    setAttendedUserIds(new Set());
    setLastUsername("");
    setShowEditInput(false);
  }, []);

  useImperativeHandle(ref, () => ({
    handleStop,
    active: !!activeSessionId,
    loading,
  }), [activeSessionId, loading]);

  useEffect(() => {
    onActiveChange?.(!!activeSessionId);
  }, [activeSessionId, onActiveChange]);

  const toggleAttended = useCallback((userId: string) => {
    setAttendedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

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
    setShowEditInput(false);
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
        setAttendedUserIds(new Set());
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
    <div className="space-y-4 h-full flex flex-col min-h-0">
      {/* Form */}
      {!activeSessionId && initialTikTokUsername && !showEditInput ? (
        /* ── Saved account: compact button ── */
        <div
          className="rounded-2xl p-4 shrink-0"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, #fe2c55, #e8254a)",
                }}
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/80 truncate">
                  @{initialTikTokUsername}
                </p>
                <p className="text-[11px] text-white/30">
                  Listo para iniciar live
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setInput(initialTikTokUsername ? `https://www.tiktok.com/@${initialTikTokUsername}` : "");
                  setShowEditInput(true);
                }}
                className="text-[11px] text-white/30 hover:text-white/50 transition-colors px-2 py-1"
              >
                Cambiar
              </button>

              <Button
                type="button"
                onClick={async () => {
                  const username = initialTikTokUsername;
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
                      if (sessionId) setActiveSessionId(sessionId);
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
                }}
                disabled={loading}
                className="h-10 px-5 bg-[#fe2c55] hover:bg-[#fe2c55]/80 text-white font-semibold text-xs rounded-xl shadow-lg shadow-[#fe2c55]/25 disabled:opacity-40 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Conectando...
                  </span>
                ) : (
                  `Iniciar live`
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : !activeSessionId ? (
        /* ── Manual input ── */
        <div
          className={`rounded-2xl p-4 shrink-0`}
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
            <div className="flex gap-2 self-start">
              {!activeSessionId ? (
                <Button
                  type="submit"
                  disabled={loading || !extracted}
                  className="h-11 px-6 bg-[#fe2c55] hover:bg-[#fe2c55]/80 text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#fe2c55]/25 disabled:opacity-40"
                >
                  {loading && (
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  )}
                  {loading ? "Conectando..." : "Iniciar"}
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}

      {/* Live panels */}
      {activeSessionId && (
        <>
          {/* Desktop stop button (mobile has it in AppNav) */}
          <div className="max-md:hidden flex justify-end shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="h-9 px-4 border-white/15 text-white/60 hover:bg-white/5 rounded-xl text-xs"
              onClick={handleStop}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Deteniendo...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Detener live
                </span>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
          {/* Desktop leads card */}
          <div className="max-md:hidden lg:col-span-2 rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <TopUsers
              sessionId={activeSessionId}
              selectedUserIds={selectedUserIds}
              onToggleUser={toggleUser}
              attendedUserIds={attendedUserIds}
              onToggleAttended={toggleAttended}
              maxMobileItems={5}
              onConnectionError={handleConnectionError}
            />
          </div>
          {/* Mobile leads card with tabs */}
          <div className="md:hidden rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <LeadsMobile
              sessionId={activeSessionId}
              selectedUserIds={selectedUserIds}
              onToggleUser={toggleUser}
              attendedUserIds={attendedUserIds}
              onToggleAttended={toggleAttended}
              onConnectionError={handleConnectionError}
            />
          </div>
          <div className="lg:col-span-3 lg:order-last rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <LiveChat sessionId={activeSessionId} selectedUserIds={selectedUserIds} onConnectionError={handleConnectionError} />
          </div>
        </div>
      </>)}
    </div>
  );
});
