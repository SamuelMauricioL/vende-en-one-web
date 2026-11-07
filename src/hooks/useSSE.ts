"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { authHeaders } from "@/lib/api-auth";
import { getSSEUrl } from "@/lib/api";

interface SSEEvent<T> {
  type: "initial" | "update" | "delta" | "status";
  stats?: T[];
  chat?: T[];
  status?: string;
  error?: string;
}

/**
 * Stream de stats o chat de una sesión.
 * EventSource no acepta headers: se pide un ticket de corta vida y viaja en la
 * query. Al reconectar se pide uno nuevo, porque el anterior caduca a los 60s.
 */
export function useSSE<T>(
  path: string,
  sessionId: string,
): {
  data: T[] | null;
  connected: boolean;
  status: string | null;
  connectionError: string | null;
} {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [data, setData] = useState<T[] | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!path || !sessionId) return;

    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

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
          const parsed: SSEEvent<T> = JSON.parse(event.data);

          if (parsed.type === "initial" || parsed.type === "update") {
            setData(parsed.stats || parsed.chat || null);
          } else if (parsed.type === "delta") {
            if (parsed.stats) {
              // Merge by tiktokUserId — replace existing or add new
              setData((prev) => {
                if (!prev) return parsed.stats;
                const map = new Map(
                  (prev as any[]).map((u: any) => [u.tiktokUserId, u]),
                );
                for (const u of parsed.stats as any[]) {
                  map.set(u.tiktokUserId, u);
                }
                return Array.from(map.values());
              });
            } else if (parsed.chat) {
              setData((prev) => {
                const next = [...(prev ?? [])];
                next.push(...parsed.chat!);
                if (next.length > 50) next.splice(0, next.length - 50);
                return next;
              });
            }
          } else if (parsed.type === "status") {
            setStatus(parsed.status ?? null);
            if (parsed.status === "error" && parsed.error) {
              setConnectionError(parsed.error);
            }
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

  return { data, connected, status, connectionError };
}
