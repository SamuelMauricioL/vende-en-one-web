"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/** How long a purchase alert stays on screen before it dismisses itself. */
const ALERT_LIFETIME_MS = 6000;

/** Newest alerts win: older ones are dropped so the stack never grows. */
const MAX_ALERTS = 3;

export interface CompraLead {
  tiktokUserId: string;
  name: string;
  message: string | null;
}

interface CompraAlert extends CompraLead {
  id: number;
}

let alertSeq = 0;

/**
 * Turns the current "compra" leads into one-shot alerts.
 * `null` means "not loaded yet"; the first loaded snapshot only seeds the seen
 * set, so leads already classified before the panel mounted never alert.
 */
function useCompraAlerts(leads: CompraLead[] | null) {
  const [alerts, setAlerts] = useState<CompraAlert[]>([]);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!leads) return;

    if (seen.current === null) {
      seen.current = new Set(leads.map((lead) => lead.tiktokUserId));
      return;
    }

    const fresh = leads.filter((lead) => !seen.current!.has(lead.tiktokUserId));
    if (fresh.length === 0) return;

    for (const lead of fresh) seen.current.add(lead.tiktokUserId);
    setAlerts((prev) =>
      [...fresh.map((lead) => ({ ...lead, id: (alertSeq += 1) })), ...prev].slice(0, MAX_ALERTS),
    );
  }, [leads]);

  const dismiss = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  return { alerts, dismiss };
}

interface PurchaseAlertsProps {
  /** Compra leads of the running live, or null before the first snapshot. */
  leads: CompraLead[] | null;
  onOpenLead: (tiktokUserId: string) => void;
}

/**
 * WhatsApp-style floating alert for purchase leads.
 * Web: top-right stack that pauses while hovered or focused.
 * Mobile: full-width stack under the top edge, tap opens the lead.
 */
export function PurchaseAlerts({ leads, onOpenLead }: PurchaseAlertsProps) {
  const { alerts, dismiss } = useCompraAlerts(leads);

  return (
    <div
      aria-live="polite"
      aria-label="Nuevos leads de compra"
      className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[360px] max-sm:[&>*:nth-child(n+3)]:hidden"
    >
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onDismiss={dismiss}
          onOpen={() => {
            onOpenLead(alert.tiktokUserId);
            dismiss(alert.id);
          }}
        />
      ))}
    </div>
  );
}

interface AlertCardProps {
  alert: CompraAlert;
  onDismiss: (id: number) => void;
  onOpen: () => void;
}

function AlertCard({ alert, onDismiss, onOpen }: AlertCardProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const consumed = useRef(0);
  const lastFrame = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    let frame = 0;
    const step = (now: number) => {
      if (lastFrame.current !== null) consumed.current += now - lastFrame.current;
      lastFrame.current = now;

      const left = Math.max(0, 1 - consumed.current / ALERT_LIFETIME_MS);
      if (barRef.current) barRef.current.style.width = `${left * 100}%`;
      if (left <= 0) {
        onDismiss(alert.id);
        return;
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      lastFrame.current = null;
    };
  }, [paused, alert.id, onDismiss]);

  const initial = (alert.name.trim()[0] ?? "?").toUpperCase();

  return (
    <div
      role="group"
      aria-label={`Lead de compra: ${alert.name}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto relative overflow-hidden rounded-2xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-right-2 duration-200 ease-out motion-reduce:animate-none"
      style={{ backgroundColor: "#151c2c" }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 p-3 pr-9 text-left outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40"
      >
        <span
          aria-hidden
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ backgroundColor: "rgba(254,44,85,0.16)", color: "#ff7591" }}
        >
          {initial}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-white/90">{alert.name}</span>
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: "rgba(254,44,85,0.18)", color: "#ff7591" }}
            >
              Compra
            </span>
          </span>
          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-white/60">
            {alert.message ?? "Quiere comprar. Escríbele ahora."}
          </span>
        </span>
      </button>

      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={() => onDismiss(alert.id)}
        className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white/90 focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:outline-none"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>

      {/* Time left: exactly matches the dismissal timer. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
        <div
          ref={barRef}
          className="h-full"
          style={{ width: "100%", backgroundColor: "#fe2c55" }}
        />
      </div>
    </div>
  );
}
