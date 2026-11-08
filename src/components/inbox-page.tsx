"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { AppNav } from "@/components/app-nav";
import { ChatThread, type OutcomePayload } from "@/components/chat-thread";
import { InboxLayout } from "@/components/inbox-layout";
import { InboxList } from "@/components/inbox-list";
import { Toaster } from "@/components/ui/sonner";
import { authHeaders } from "@/lib/api-auth";
import {
  mapConversations,
  pendingTotal,
  pickActiveStore,
  type InboxLead,
  type InboxRow,
  type ThreadMessage,
} from "@/lib/inbox-api";

const LEGACY_KEY = "ll_inbox_state";
const ACTIVE_STORE_KEY = "ll_active_store";
const THREAD_PAGE = 100;

interface StoreSummary {
  _id: string;
  clerkUserId: string;
  tiktokUsername: string;
}

/** Bandeja servida por el API: agregado por persona, hilo paginado y desenlaces. */
export default function InboxPageClient() {
  const { userId, isLoaded, getToken } = useAuth();
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [store, setStore] = useState<StoreSummary | null>(null);
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [leads, setLeads] = useState<InboxLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      const headers = { ...(init?.headers ?? {}), ...(await authHeaders(getToken)) };
      return fetch(path, { ...init, headers });
    },
    [getToken],
  );

  const loadInbox = useCallback(
    async (storeId: string) => {
      const res = await api(`/api/stores/${storeId}/inbox`);
      if (!res.ok) {
        setRows([]);
        setLeads([]);
        return;
      }
      const data = (await res.json()) as { conversations: InboxRow[]; leads: InboxLead[] };
      setRows(data.conversations ?? []);
      setLeads(data.leads ?? []);
    },
    [api],
  );

  /**
   * Una sola vez: el estado que vivía en el navegador se sube al servidor.
   * Así nadie pierde los desenlaces que ya había marcado.
   */
  const migrateLegacy = useCallback(
    async (storeId: string) => {
      let raw: string | null = null;
      try {
        raw = localStorage.getItem(LEGACY_KEY);
      } catch {
        return;
      }
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw) as Record<
          string,
          { state?: string; closedAt?: number; closedThrough?: number; reason?: string; waNumber?: string }
        >;
        for (const [key, entry] of Object.entries(parsed)) {
          if (!entry?.state) continue;
          // La clave vieja era "tienda:tiktokUserId".
          const tiktokUserId = key.includes(":") ? key.slice(key.indexOf(":") + 1) : key;
          await api(`/api/stores/${storeId}/leads/${encodeURIComponent(tiktokUserId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "close",
              state: entry.state,
              reason: entry.reason,
              waNumber: entry.waNumber,
              closedThrough: entry.closedThrough ?? entry.closedAt,
            }),
          });
        }
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        // si falla, se reintenta en la próxima visita: la clave sigue ahí
      }
    },
    [api],
  );

  const switchStore = useCallback(
    async (id: string) => {
      const next = stores.find((s) => s._id === id);
      if (!next) return;
      try {
        localStorage.setItem(ACTIVE_STORE_KEY, id);
      } catch {
        // sin localStorage el cambio dura la sesión
      }
      setStore(next);
      setOpenId(null);
      setMessages([]);
      setHasMore(false);
      await loadInbox(id);
    },
    [stores, loadInbox],
  );

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let cancelled = false;

    void (async () => {
      try {
        const [storesRes, profileRes] = await Promise.all([
          api("/api/stores"),
          api(`/api/users/profile/${userId}`),
        ]);
        if (!storesRes.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = (await storesRes.json()) as { stores: StoreSummary[] };
        const list = data.stores ?? [];
        const profile = profileRes.ok
          ? ((await profileRes.json()) as { profile?: { tiktokUsername?: string } })
          : null;
        let saved: string | null = null;
        try {
          saved = localStorage.getItem(ACTIVE_STORE_KEY);
        } catch {
          saved = null;
        }
        const active = pickActiveStore(list, profile?.profile?.tiktokUsername, saved);
        if (cancelled) return;
        setStores(list);
        setStore(active);
        if (active) {
          await migrateLegacy(active._id);
          await loadInbox(active._id);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, api, loadInbox, migrateLegacy]);

  const conversations = useMemo(() => mapConversations(rows, leads), [rows, leads]);
  const openConversation = conversations.find((c) => c.tiktokUserId === openId) ?? null;

  const loadThread = useCallback(
    async (tiktokUserId: string, before?: number) => {
      if (!store) return;
      setThreadLoading(true);
      try {
        const query = new URLSearchParams({ limit: String(THREAD_PAGE) });
        if (before) query.set("before", String(before));
        const res = await api(
          `/api/stores/${store._id}/thread/${encodeURIComponent(tiktokUserId)}?${query}`,
        );
        if (!res.ok) {
          setMessages([]);
          setHasMore(false);
          return;
        }
        const data = (await res.json()) as { messages: ThreadMessage[]; hasMore: boolean };
        // El API devuelve del más nuevo al más viejo; se pinta en orden cronológico.
        const page = [...(data.messages ?? [])].reverse();
        setMessages((prev) => (before ? [...page, ...prev] : page));
        setHasMore(Boolean(data.hasMore));
      } finally {
        setThreadLoading(false);
      }
    },
    [api, store],
  );

  const openThread = useCallback(
    async (tiktokUserId: string) => {
      setOpenId(tiktokUserId);
      setMessages([]);
      setHasMore(false);
      await loadThread(tiktokUserId);
      if (!store) return;
      // Abrir marca visto; no cierra el bucle.
      await api(`/api/stores/${store._id}/leads/${encodeURIComponent(tiktokUserId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seen" }),
      });
      await loadInbox(store._id);
    },
    [api, store, loadThread, loadInbox],
  );

  const applyOutcome = useCallback(
    async (payload: OutcomePayload) => {
      if (!store || !openConversation) return;
      await api(
        `/api/stores/${store._id}/leads/${encodeURIComponent(openConversation.tiktokUserId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            closedThrough: payload.action === "close" ? openConversation.lastAt : undefined,
          }),
        },
      );
      await loadInbox(store._id);
    },
    [api, store, openConversation, loadInbox],
  );

  const pending = pendingTotal(conversations);

  return (
    <div className="h-dvh flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      <AppNav current="inbox" pendingCount={pending} />

      <InboxLayout
        list={
          loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
            </div>
          ) : !store ? (
            <div className="text-center py-20">
              <p className="text-sm text-white/35">
                {loaded ? "Primero vincula tu TikTok" : "Cargando tus conversaciones…"}
              </p>
              {loaded && (
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
            <>
              {stores.length > 1 && (
                <label className="block mb-3">
                  <span className="block text-[10px] uppercase tracking-wide text-white/25 mb-1">
                    Tienda
                  </span>
                  <select
                    value={store?._id ?? ""}
                    onChange={(e) => void switchStore(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/80 focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/40"
                  >
                    {stores.map((s) => (
                      <option key={s._id} value={s._id} style={{ color: "#0b0f1a" }}>
                        @{s.tiktokUsername}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <InboxList conversations={conversations} onOpen={openThread} />
            </>
          )
        }
        detail={
          openConversation ? (
            <ChatThread
              conversation={openConversation}
              messages={messages}
              loading={threadLoading}
              hasMore={hasMore}
              onBack={() => setOpenId(null)}
              onOutcome={applyOutcome}
              onLoadMore={() =>
                messages[0] && loadThread(openConversation.tiktokUserId, messages[0].createdAt)
              }
            />
          ) : null
        }
      />

      <Toaster richColors position="bottom-center" />
    </div>
  );
}
