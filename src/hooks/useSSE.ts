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
import type { LeadRow, Totals } from "@/lib/filters-api";
import {
  EMPTY_LIVE_STREAM,
  applyStoreFrame,
  type LivePhase,
  type LiveStreamState,
  type StoreFrame,
} from "@/lib/inbox-live";

/**
 * Frames del stream de una sesión.
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

/** `session` es el stream de una sesión; `store` el de la bandeja (S8). */
export type StreamKind = "session" | "store";

/** Fase del live tal como la emite el stream por tienda. */
export type StoreLivePhase = LivePhase;

/**
 * Stream de stats o chat de una sesión.
 * EventSource no acepta headers: se pide un ticket de corta vida y viaja en la
 * query. Al reconectar se pide uno nuevo, porque el anterior caduca a los 60s.
 * `T` es la fila del stream: `LeadRow` para stats, el mensaje de chat para chat.
 */
export function useSSE<T>(
  path: string,
  target: string,
  kind: StreamKind = "session",
): {
  data: T[] | null;
  totals: Totals | null;
  connected: boolean;
  status: string | null;
  connectionError: string | null;
  /** Solo se llena con `kind: "store"`: fase, foto y error del live. */
  live: LiveStreamState;
} {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [data, setData] = useState<T[] | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveStreamState>(EMPTY_LIVE_STREAM);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!path || !target) return;

    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

    setData(null);
    setTotals(null);
    if (kind === "store") setLive(EMPTY_LIVE_STREAM);

    /**
     * Ticket de corta vida; `status` es el HTTP del pedido (0 si la red falló).
     * El stream por tienda tiene su propia ruta (S8): no es la de sesión.
     */
    const fetchTicket = async (): Promise<{ ticket: string; status: number }> => {
      const endpoint =
        kind === "store"
          ? `/api/stores/${encodeURIComponent(target)}/live/ticket`
          : `/api/lives/ticket?kind=${kind}&target=${encodeURIComponent(target)}`;
      try {
        const res = await fetch(endpoint, { headers: await authHeaders(getTokenRef.current) });
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

    /**
     * Sin el ticket la conexión no arranca. Sesión muerta corta el reintento;
     * el stream por tienda sobrevive a las sesiones, así que siempre reintenta.
     */
    const scheduleRetry = (
      retries: number,
      ticketStatus: number,
      readyState: number,
    ): boolean => {
      if (kind === "session") {
        if (isDeadSessionStatus(ticketStatus)) {
          reportDeadSession();
          return false;
        }
        if (!shouldRetryStream({ ticketStatus, readyState, retries })) return false;
      }
      retry = setTimeout(() => void connect(retries + 1), 2_000);
      return true;
    };

    const connect = async (retries: number) => {
      const { ticket, status: ticketStatus } = await fetchTicket();
      if (cancelled) return;

      if (!ticket) {
        setConnected(false);
        scheduleRetry(retries, ticketStatus, EVENT_SOURCE_CLOSED);
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
          if (kind === "store") {
            // Fase en `state`, foto completa en `stats`, desenlace en `outcome`.
            setLive((prev) => applyStoreFrame(prev, JSON.parse(event.data) as StoreFrame));
            return;
          }

          const parsed: StreamFrame<T> = JSON.parse(event.data);

          if (parsed.type === "status") {
            setStatus(parsed.status);
            if (parsed.status === "error" && parsed.error) {
              setConnectionError(parsed.error);
            }
          } else if ("chat" in parsed) {
            if (parsed.type === "initial") {
              setData(parsed.chat);
            } else {
              // El tope lo pone el servidor: acá no se recorta nada.
              setData((prev) => [...(prev ?? []), ...parsed.chat]);
            }
          } else {
            // Lista completa y ordenada por el servidor: se reemplaza tal cual.
            if ("stats" in parsed && parsed.stats) {
              setData(parsed.stats);
              setTotals(parsed.totals ?? null);
            }
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
        // Reintento con ticket nuevo: el anterior puede haber caducado.
        scheduleRetry(retries, ticketStatus, readyStateBefore);
      };
    };

    void connect(0);

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [path, target, kind]);

  return { data, totals, connected, status, connectionError, live };
}

/**
 * S8/S9: stream de la tienda para la bandeja. Se mantiene abierto entre
 * sesiones y emite `status` con `state` `idle` | `live` | `ended`.
 */
export function useStoreLiveStream(storeId: string | null): {
  rows: LeadRow[] | null;
  totals: Totals | null;
  connected: boolean;
  phase: StoreLivePhase | null;
  error: string | null;
} {
  const stream = useSSE<LeadRow>(
    storeId ? `/stores/${encodeURIComponent(storeId)}/live/stream` : "",
    storeId ?? "",
    "store",
  );
  const { phase, rows, totals, error } = stream.live;
  return { rows, totals, connected: stream.connected, phase, error };
}
