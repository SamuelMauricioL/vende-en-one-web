"use client";

import { useCallback, useRef, useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopUsers } from "./top-users";
import { LiveChat } from "./live-chat";
import { LeadsMobile } from "./LeadsMobile";
import { LiveEndedDialog } from "./LiveEndedDialog";
import { trackEvent } from "@/lib/plausible";

const TIKTOK_URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.-]+)/;
const TIKTOK_HANDLE_REGEX = /^@?([a-zA-Z0-9_.-]+)$/;
const RECONNECT_KEY = "lastLiveUsername";

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
  const [attendedMap, setAttendedMap] = useState<Map<string, { attendedAt: number; commentCount: number }>>(new Map());
  const [lastUsername, setLastUsername] = useState(initialTikTokUsername);
  const [showEditInput, setShowEditInput] = useState(false);
  const [showLiveEndedDialog, setShowLiveEndedDialog] = useState(false);
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({ compra: 0, negociando: 0, interesado: 0 });

  const onStageCountsReport = useCallback((counts: Record<string, number>) => {
    setStageCounts(counts);
  }, []);

  // ── Auto-reconnect on mount ──
  const autoReconnectAttempted = useRef(false);

  useEffect(() => {
    if (autoReconnectAttempted.current) return;
    const saved = localStorage.getItem(RECONNECT_KEY);
    if (saved && !initialTikTokUsername) {
      autoReconnectAttempted.current = true;
      startLive(saved, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLive = async (username: string, isAutoReconnect = false) => {
    setLastUsername(username);
    setLoading(true);

    // Check if the user is actually live on TikTok before starting
    try {
      const checkRes = await fetch(`/api/lives/check/${encodeURIComponent(username)}`);
      if (checkRes.ok) {
        const { isLive } = await checkRes.json();
        if (!isLive) {
          if (isAutoReconnect) {
            // Silent cleanup — user came back and live already ended
            localStorage.removeItem(RECONNECT_KEY);
            setLoading(false);
            return;
          }
          // User initiated — warn but let them proceed
          toast.info(
            `${username} no está en vivo ahora. Si empieza su live después, los leads se capturarán automáticamente.`,
            { duration: 5000 },
          );
        }
      }
    } catch {
      // If check fails, proceed anyway (network error, etc.)
    }

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
        localStorage.setItem(RECONNECT_KEY, username);
        trackEvent(isAutoReconnect ? "Live Reconnected" : "Live Started", { username });
      } else {
        trackEvent("Live Start Failed", { username, status: res.status });
        toast.error(`Error al iniciar: ${data.message || res.status}`);
        localStorage.removeItem(RECONNECT_KEY);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Fallo de red: ${msg}`);
      localStorage.removeItem(RECONNECT_KEY);
    } finally {
      setLoading(false);
    }
  };

  const liveEndedHandled = useRef(false);

  const handleConnectionError = useCallback((error: string) => {
    if (error === "El live ha finalizado") {
      if (liveEndedHandled.current) return;
      liveEndedHandled.current = true;
      setActiveSessionId(null);
      setShowLiveEndedDialog(true);
      // Keep the UI data + state visible so the user can review leads
      return;
    }
    toast.error(`Error al conectar: ${error}`);
    localStorage.removeItem(RECONNECT_KEY);
    setActiveSessionId(null);
    setSelectedUserIds(new Set());
    setAttendedMap(new Map());
    // Keep localStorage so data survives page reloads
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

  const toggleAttended = useCallback((userId: string, commentCount?: number) => {
    setAttendedMap((prev) => {
      const next = new Map(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.set(userId, { attendedAt: Date.now(), commentCount: commentCount ?? 0 });
      }
      return next;
    });
  }, []);

  // Persist attendedMap to localStorage
  useEffect(() => {
    if (!activeSessionId) return;
    const key = `attended_${activeSessionId}`;
    const entries = Array.from(attendedMap.entries());
    if (entries.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(entries));
    }
  }, [attendedMap, activeSessionId]);

  // Restore attendedMap from localStorage when session starts
  useEffect(() => {
    if (!activeSessionId) return;
    const key = `attended_${activeSessionId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const entries: [string, { attendedAt: number; commentCount: number }][] = JSON.parse(saved);
        setAttendedMap(new Map(entries));
      }
    } catch {
      // Ignore corrupt data
    }
  }, [activeSessionId]);

  const toggleUser = useCallback((userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.has(userId)) {
        // Tap mismo usuario → deseleccionar (mostrar todos)
        return new Set();
      }
      // Seleccionar solo este usuario
      return new Set([userId]);
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

    // Check if user is actually live
    try {
      const checkRes = await fetch(`/api/lives/check/${encodeURIComponent(username)}`);
      if (checkRes.ok) {
        const { isLive } = await checkRes.json();
        if (!isLive) {
          toast.info(
            `${username} no está en vivo ahora. Si empieza su live después, los leads se capturarán automáticamente.`,
            { duration: 5000 },
          );
        }
      }
    } catch {
      // proceed anyway
    }

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
        localStorage.setItem(RECONNECT_KEY, username);
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
      } else {
        trackEvent("Live Stop Failed", { username: lastUsername, status: res.status });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      trackEvent("Live Stop Failed", { username: lastUsername, status: msg });
    } finally {
      // Always clean up locally — even if the API fails, the user just wants to stop
      localStorage.removeItem(RECONNECT_KEY);
      setActiveSessionId(null);
      setShowLiveEndedDialog(true);
      setLoading(false);
      // Keep selectedUserIds, attendedMap, lastUsername — data stays visible
    }
  };

  const extracted = input.trim() ? extractUsername(input.trim()) : null;

  const goToHistory = useCallback(() => {
    const u = lastUsername || initialTikTokUsername;
    if (u) {
      window.location.href = `/app/history?username=${encodeURIComponent(u)}`;
    } else {
      window.location.href = "/app/history";
    }
  }, [lastUsername, initialTikTokUsername]);

  return (
    <div className="space-y-4 h-full flex flex-col min-h-0">
      {/* Form */}
      {!activeSessionId && initialTikTokUsername && !showEditInput ? (
        /* ── Saved account: hero card ── */
        <div className="max-w-lg mx-auto w-full shrink-0 pt-8 md:pt-12">
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(254,44,85,0.08) 0%, rgba(37,244,238,0.04) 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Accent bar */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #fe2c55, #25f4ee)" }} />

            <div className="p-6 sm:p-8">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: "linear-gradient(135deg, #fe2c55, #e8254a)",
                  boxShadow: "0 8px 32px rgba(254,44,85,0.25)",
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </div>

              <h2 className="text-xl font-extrabold text-white/90 tracking-tight mb-1">
                Monitorear live
              </h2>
              <p className="text-sm text-white/40 mb-6">
                Captura leads de tu TikTok Live en tiempo real con <span className="text-[#25f4ee] font-semibold">97% de precisión</span>
              </p>

              {/* Account info */}
              <div className="flex items-center justify-between gap-3 p-4 rounded-2xl mb-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#fe2c55]/20">
                    <svg className="w-5 h-5 text-[#fe2c55]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.4 2.89 2.89 0 01-2.2-4.87 2.89 2.89 0 014.19.08V8.82a6.27 6.27 0 005.11 6.07 6.27 6.27 0 002.9.06V11.5a2.89 2.89 0 01-1.9.68 2.89 2.89 0 01-2.88-2.89V5.57a4.84 4.84 0 003.78 4.29l.1.02V6.69z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/80 truncate">
                      @{initialTikTokUsername}
                    </p>
                    <p className="text-[11px] text-white/30">
                      Listo para iniciar
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setInput(initialTikTokUsername ? `https://www.tiktok.com/@${initialTikTokUsername}` : "");
                    setShowEditInput(true);
                  }}
                  className="text-[11px] text-white/30 hover:text-white/60 transition-colors px-2 py-1 shrink-0"
                >
                  Cambiar
                </button>
              </div>

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
                      localStorage.setItem(RECONNECT_KEY, username);
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
                className="w-full h-12 bg-[#fe2c55] hover:bg-[#fe2c55]/80 text-white font-bold text-sm rounded-xl shadow-lg shadow-[#fe2c55]/25 disabled:opacity-40 transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Conectando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                    Iniciar live
                  </span>
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-white/15 text-center mt-5 leading-relaxed max-w-sm mx-auto">
            Lo que no vendiste en el live, véndelo después.{' '}
            <span className="text-white/25">Captura sus datos, escríbeles y cierra la venta.</span>
          </p>
        </div>
      ) : !activeSessionId ? (
        /* ── Manual input ── */
        <div className="max-w-lg mx-auto w-full shrink-0 pt-8 md:pt-12">
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="p-6 sm:p-8">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: "linear-gradient(135deg, #fe2c55, #e8254a)",
                  boxShadow: "0 8px 32px rgba(254,44,85,0.25)",
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </div>

              <h2 className="text-xl font-extrabold text-white/90 tracking-tight mb-1">
                Monitorear live
              </h2>
              <p className="text-sm text-white/40 mb-6">
                Captura leads de tu TikTok Live en tiempo real con <span className="text-[#25f4ee] font-semibold">97% de precisión</span>
              </p>

              <form onSubmit={handleStart} className="space-y-4">
                <div>
                  <label htmlFor="tiktok-url" className="block text-xs font-medium text-white/40 mb-1.5">
                    Enlace del perfil TikTok
                  </label>
                  <Input
                    id="tiktok-url"
                    type="url"
                    inputMode="url"
                    placeholder="https://www.tiktok.com/@usuario"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                    className="h-12 text-sm bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 focus-visible:ring-[#fe2c55]/50"
                  />
                  {input.trim() && extracted && (
                    <p className="mt-1.5 text-[11px] text-white/20 font-mono text-center">
                      @{extracted}
                    </p>
                  )}
                  {input.trim() && !extracted && (
                    <p className="mt-1.5 text-[11px] text-[#fe2c55]/60 text-center">
                      Enlace no válido — debe ser tiktok.com/@usuario
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !extracted}
                  className="w-full h-12 bg-[#fe2c55] hover:bg-[#fe2c55]/80 text-white font-bold text-sm rounded-xl shadow-lg shadow-[#fe2c55]/25 disabled:opacity-40 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Conectando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      Iniciar live
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>

          <p className="text-xs text-white/15 text-center mt-5 leading-relaxed max-w-sm mx-auto">
            Lo que no vendiste en el live, véndelo después.{' '}
            <span className="text-white/25">Captura sus datos, escríbeles y cierra la venta.</span>
          </p>
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
              attendedMap={attendedMap}
              onToggleAttended={toggleAttended}
              maxMobileItems={5}
              onConnectionError={handleConnectionError}
              onStageCountsReport={onStageCountsReport}
            />
          </div>
          {/* Mobile leads card */}
          <div className="md:hidden rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <LeadsMobile
              sessionId={activeSessionId}
              selectedUserIds={selectedUserIds}
              onToggleUser={toggleUser}
              attendedMap={attendedMap}
              onToggleAttended={toggleAttended}
              onConnectionError={handleConnectionError}
              onStageCountsReport={onStageCountsReport}
            />
          </div>
          <div className="lg:col-span-3 lg:order-last flex flex-col min-h-0 overflow-hidden">
            <LiveChat sessionId={activeSessionId} selectedUserIds={selectedUserIds} onConnectionError={handleConnectionError} />
          </div>
        </div>
      </>)}

      {showLiveEndedDialog && (
        <LiveEndedDialog
          stageCounts={stageCounts}
          onClose={() => setShowLiveEndedDialog(false)}
          onGoToHistory={goToHistory}
        />
      )}
    </div>
  );
});
