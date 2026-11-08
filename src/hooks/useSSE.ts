"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { authHeaders } from "@/lib/api-auth";
import { getSSEUrl } from "@/lib/api";
import type { Totals } from "@/lib/filters-api";

/**
 * Frames del API (S8).
 * Stats: el servidor manda siempre la lista completa y ya ordenada en
 * `initial`/`update`, con sus `totals`; no hay `delta` para stats.
 * Chat: `initial` con el historial y `delta` con el lote nuevo.
 */
type StatsFrame<T> = { type: "initial" | "update"; stats: T[]; totals: Totals };
type ChatFrame<T> = { type: "initial" | "delta"; chat: T[] };
type StreamFrame<T> =
  | StatsFrame<T>
  | ChatFrame<T>
  | { type: "status"; status: string; error?: string };

/**
 * Stream de stats o chat de una sesión.
 * EventSource no acepta headers: se pide un ticket de corta vida y viaja en la
 * query. Al reconectar se pide uno nuevo, porque el anterior caduca a los 60s.
 * `T` es la fila del stream: `LeadRow` para stats, el mensaje de chat para chat.
 */
export function useSSE<T>(
  path: string,
  sessionId: string,
): {
  data: T[] | null;
  totals: Totals | null;
  connected: boolean;
  status: string | null;
  connectionError: string | null;
} {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [data, setData] = useState<T[] | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!path || !sessionId) return;

    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

    setData(null);
    setTotals(null);

    const fetchTicket = async (): Promise<string> => {
      try {
        const res = await fetch(
          `/api/lives/ticket?kind=session&target=${encodeURIComponent(sessionId)}`,
          { headers: await authHeaders(getTokenRef.current) },
        );
        if (!res.ok) return "";
        const body = (await res.json()) as { ticket?: string };
        return body.ticket ?? "";
      } catch {
        return "";
      }
    };

    const connect = async () => {
      const ticket = await fetchTicket();
      if (cancelled) return;

      const eventSource = new EventSource(
        getSSEUrl(`${path}?ticket=${encodeURIComponent(ticket)}`),
      );
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed: StreamFrame<T> = JSON.parse(event.data);

          if (parsed.type === "status") {
            setStatus(parsed.status);
            if (parsed.status === "error" && parsed.error) {
              setConnectionError(parsed.error);
            }
          } else if ("stats" in parsed) {
            // Lista completa y ordenada por el servidor: se reemplaza tal cual.
            setData(parsed.stats);
            setTotals(parsed.totals);
          } else if (parsed.type === "initial") {
            setData(parsed.chat);
          } else {
            setData((prev) => {
              const next = [...(prev ?? []), ...parsed.chat];
              if (next.length > 50) next.splice(0, next.length - 50);
              return next;
            });
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        eventSource.close();
        if (cancelled) return;
        // Reintento con ticket nuevo: el anterior puede haber caducado.
        retry = setTimeout(() => void connect(), 2_000);
      };
    };

    void connect();

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [path, sessionId]);

  return { data, totals, connected, status, connectionError };
}
