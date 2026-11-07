"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { AppNav } from "@/components/app-nav";
import { ChatThread } from "@/components/chat-thread";
import { InboxLayout } from "@/components/inbox-layout";
import { InboxList } from "@/components/inbox-list";
import { Toaster } from "@/components/ui/sonner";
import {
  buildConversations,
  liveLabel,
  loadState,
  saveState,
  type InboxSessionInput,
  type InboxState,
} from "@/lib/inbox-state";

/** Bandeja de rescate: datos + estado; la lista y el hilo son presentacionales. */
export default function InboxPageClient() {
  const { userId, isLoaded } = useAuth();
  const [store, setStore] = useState("");
  const [sessions, setSessions] = useState<InboxSessionInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [inbox, setInbox] = useState<InboxState>({});

  useEffect(() => {
    setInbox(loadState());
  }, []);

  const applyState = useCallback((next: InboxState) => {
    setInbox(next);
    saveState(next);
  }, []);

  const fetchHistory = useCallback(async (u: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lives/history/${encodeURIComponent(u)}`);
      const data = await res.json();
      setSessions((data.sessions ?? []) as InboxSessionInput[]);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    fetch(`/api/users/profile/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const handle = data?.profile?.tiktokUsername;
        if (!handle) {
          setLoaded(true);
          return;
        }
        setStore(handle);
        fetchHistory(handle);
      })
      .catch(() => setLoaded(true));
  }, [userId, isLoaded, fetchHistory]);

  const conversations = useMemo(
    () => (store ? buildConversations(sessions, store, inbox) : []),
    [sessions, store, inbox],
  );

  const lives = useMemo(() => {
    const seen = new Map<string, number>();
    for (const s of sessions) {
      if (!s.summary || s.status === "error") continue;
      seen.set(s._id, s.endedAt ?? s.startedAt);
    }
    return [...seen.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([sessionId, endedAt]) => ({ sessionId, label: liveLabel(endedAt) }));
  }, [sessions]);

  const pendingTotal = conversations.filter((c) => !c.closed).length;
  const openConversation = conversations.find((c) => c.key === openKey) ?? null;

  return (
    <div className="h-dvh flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      <AppNav current="inbox" pendingCount={pendingTotal} />

      <InboxLayout
        list={
          loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
            </div>
          ) : !loaded || !store ? (
            <div className="text-center py-20">
              <p className="text-sm text-white/35">
                {loaded ? "Primero vincula tu TikTok" : "Cargando tus conversaciones…"}
              </p>
              {loaded && !store && (
                <a
                  href="/onboarding"
                  className="inline-block mt-3 h-9 px-4 leading-9 rounded-xl text-xs font-semibold text-white"
                  style={{ background: "#fe2c55" }}
                >
                  Ir al onboarding
                </a>
              )}
            </div>
          ) : (
            <InboxList
              conversations={conversations}
              lives={lives}
              inbox={inbox}
              onOpen={setOpenKey}
            />
          )
        }
        detail={
          openConversation && store ? (
            <ChatThread
              conversation={openConversation}
              store={store}
              state={inbox}
              onStateChange={applyState}
              onBack={() => setOpenKey(null)}
            />
          ) : null
        }
      />

      <Toaster richColors position="bottom-center" />
    </div>
  );
}
