"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { authHeaders } from "@/lib/api-auth";
import { getSSEUrl } from "@/lib/api";
import {
  EVENT_SOURCE_CLOSED,
  isDeadSessionStatus,
  shouldRetryStream,
} from "@/lib/live-reconnect";
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

    /** Ticket de corta vida; `status` es el HTTP del pedido (0 si la red falló). */
    const fetchTicket = async (): Promise<{ ticket: string; status: number }> => {
      try {
        const res = await fetch(
          `/api/lives/ticket?kind=session&target=${encodeURIComponent(sessionId)}`,
          { headers: await authHeaders(getTokenRef.current) },
        );
        if (!res.ok) return { ticket: "", status: res.status };
        const body = (await res.json()) as { ticket?: string };
        return { ticket: body.ticket ?? "", status: res.status };
      } catch {
        return { ticket: "", status: 0 };
      }
    };

    /** La sesión ya no existe: el live terminó. No se reintenta más. */
    const reportDeadSession = () => {
      setConnected(false);
      setStatus("error");
      setConnectionError("El live ha finalizado");
    };

    const connect = async (retries: number) => {
      const { ticket, status: ticketStatus } = await fetchTicket();
      if (cancelled) return;

      if (!ticket) {
        setConnected(false);
        if (isDeadSessionStatus(ticketStatus)) {
          reportDeadSession();
          return;
        }
        // Sin ticket no hay stream: misma regla que un corte de red.
        if (shouldRetryStream({ ticketStatus, readyState: EVENT_SOURCE_CLOSED, retries })) {
          retry = setTimeout(() => void connect(retries + 1), 2_000);
        }
        return;
      }

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
            // El tope lo pone el servidor: acá no se recorta nada.
            setData((prev) => [...(prev ?? []), ...parsed.chat]);
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };

      eventSource.onerror = () => {
        // Se lee antes de cerrar: CLOSED significa que el servidor rechazó.
        const readyStateBefore = eventSource.readyState;
        setConnected(false);
        eventSource.close();
        if (cancelled) return;
        if (isDeadSessionStatus(ticketStatus)) {
          reportDeadSession();
          return;
        }
        if (!shouldRetryStream({ ticketStatus, readyState: readyStateBefore, retries })) return;
        // Reintento con ticket nuevo: el anterior puede haber caducado.
        retry = setTimeout(() => void connect(retries + 1), 2_000);
      };
    };

    void connect(0);

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [path, sessionId]);

  return { data, totals, connected, status, connectionError };
}
