"use client";

import { useEffect, useRef, useState } from "react";

interface SSEEvent<T> {
  type: "initial" | "update";
  stats?: T[];
  chat?: T[];
}

export function useSSE<T>(url: string): { data: T[] | null; connected: boolean } {
  const [data, setData] = useState<T[] | null>(null);
  const [connected, setConnected] = useState(false);
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
        if (parsed.type === "initial" || parsed.type === "update") {
          setData(parsed.stats || parsed.chat || null);
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
      setConnected(false);
    };
  }, [url]);

  return { data, connected };
}
