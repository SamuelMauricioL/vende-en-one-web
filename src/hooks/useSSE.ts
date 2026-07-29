"use client";

import { useEffect, useRef, useState } from "react";

interface SSEEvent<T> {
  type: "initial" | "update" | "delta" | "status";
  stats?: T[];
  chat?: T[];
  status?: string;
  error?: string;
}

export function useSSE<T>(
  url: string,
): {
  data: T[] | null;
  connected: boolean;
  status: string | null;
  connectionError: string | null;
} {
  const [data, setData] = useState<T[] | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url) return;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed: SSEEvent<T> = JSON.parse(event.data);

        if (parsed.type === "initial") {
          setData(parsed.stats || parsed.chat || null);
        } else if (parsed.type === "delta") {
          if (parsed.stats) {
            // Merge by tiktokUserId — replace existing or add new
            setData((prev) => {
              if (!prev) return parsed.stats;
              const map = new Map(
                (prev as any[]).map((u: any) => [u.tiktokUserId, u]),
              );
              for (const u of parsed.stats) {
                map.set((u as any).tiktokUserId, u);
              }
              return Array.from(map.values()) as T[];
            });
          }
          if (parsed.chat) {
            // Append new messages, keep max ~50
            setData((prev) => {
              const next = [...(prev || []), ...parsed.chat!];
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
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [url]);

  return { data, connected, status, connectionError };
}
