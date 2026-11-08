"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { AppNav } from "@/components/app-nav";
import { ChatThread, type OutcomePayload } from "@/components/chat-thread";
import { InboxLayout } from "@/components/inbox-layout";
import { InboxList } from "@/components/inbox-list";
import { Toaster } from "@/components/ui/sonner";
import { authHeaders } from "@/lib/api-auth";
import { readActiveStoreId, useActiveStoreId } from "@/lib/active-store";
import {
  mapConversations,
  pendingTotal,
  pickActiveStore,
  type Conversation,
  type InboxLead,
  type InboxRow,
  type ThreadMessage,
} from "@/lib/inbox-api";

const LEGACY_KEY = "ll_inbox_state";
const THREAD_PAGE = 100;

interface StoreSummary {
  _id: string;
  clerkUserId: string;
  tiktokUsername: string;
}

/** Datos de una tienda ya mapeados: el mismo @ puede existir en dos tiendas. */
interface ScopedData {
  storeId: string;
  storeLabel: string;
  rows: InboxRow[];
  leads: InboxLead[];
}

type Scope = "store" | "all";

/** Bandeja servida por el API: agregado por persona, hilo paginado y desenlaces. */
export default function InboxPageClient() {
  const { userId, isLoaded, getToken } = useAuth();
  const activeStoreId = useActiveStoreId();
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [store, setStore] = useState<StoreSummary | null>(null);
  const [scope, setScope] = useState<Scope>("store");
  const [data, setData] = useState<ScopedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
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

  const loadStore = useCallback(
    async (target: StoreSummary): Promise<ScopedData | null> => {
      const res = await api(`/api/stores/${target._id}/inbox`);
      if (!res.ok) return null;
      const payload = (await res.json()) as { conversations: InboxRow[]; leads: InboxLead[] };
      return {
        storeId: target._id,
        storeLabel: `@${target.tiktokUsername}`,
        rows: payload.conversations ?? [],
        leads: payload.leads ?? [],
      };
    },
    [api],
  );

  const loadInbox = useCallback(
    async (nextScope: Scope, target: StoreSummary | null, list: StoreSummary[]) => {
      const targets = nextScope === "all" ? list : target ? [target] : [];
      const results = await Promise.all(targets.map((t) => loadStore(t)));
      setData(results.filter((r): r is ScopedData => r !== null));
    },
    [loadStore],
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
        const payload = (await storesRes.json()) as { stores: StoreSummary[] };
        const list = payload.stores ?? [];
        const profile = profileRes.ok
          ? ((await profileRes.json()) as { profile?: { tiktokUsername?: string } })
          : null;
        // La tienda activa del menú manda; el @ del perfil es el respaldo.
        const saved = activeStoreId ?? readActiveStoreId();
        const active = pickActiveStore(list, profile?.profile?.tiktokUsername, saved);
        if (cancelled) return;
        setStores(list);
        setStore(active);
        if (active) {
          await migrateLegacy(active._id);
          await loadInbox("store", active, list);
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
    // activeStoreId cambia cuando se elige otra tienda en el menú
  }, [isLoaded, userId, api, loadInbox, migrateLegacy, activeStoreId]);

  const conversations = useMemo(
    () =>
      data.flatMap((chunk) =>
        mapConversations(chunk.rows, chunk.leads, {
          storeId: chunk.storeId,
          storeLabel: chunk.storeLabel,
        }),
      ),
    [data],
  );

  const openConversation = conversations.find((c) => c.key === openKey) ?? null;

  const switchScope = useCallback(
    async (next: Scope) => {
      setScope(next);
      setOpenKey(null);
      setMessages([]);
      setHasMore(false);
      setLoading(true);
      try {
        await loadInbox(next, store, stores);
      } finally {
        setLoading(false);
      }
    },
    [loadInbox, store, stores],
  );

  const loadThread = useCallback(
    async (conversation: Conversation, before?: number) => {
      setThreadLoading(true);
      try {
        const query = new URLSearchParams({ limit: String(THREAD_PAGE) });
        if (before) query.set("before", String(before));
        const res = await api(
          `/api/stores/${conversation.storeId}/thread/${encodeURIComponent(conversation.tiktokUserId)}?${query}`,
        );
        if (!res.ok) {
          setMessages([]);
          setHasMore(false);
          return;
        }
        const payload = (await res.json()) as { messages: ThreadMessage[]; hasMore: boolean };
        // El API devuelve del más nuevo al más viejo; se pinta cronológico.
        const page = [...(payload.messages ?? [])].reverse();
        setMessages((prev) => (before ? [...page, ...prev] : page));
        setHasMore(Boolean(payload.hasMore));
      } finally {
        setThreadLoading(false);
      }
    },
    [api],
  );

  const openThread = useCallback(
    async (conversation: Conversation) => {
      setOpenKey(conversation.key);
      setMessages([]);
      setHasMore(false);
      await loadThread(conversation);
      // Abrir marca visto; no cierra el bucle.
      await api(
        `/api/stores/${conversation.storeId}/leads/${encodeURIComponent(conversation.tiktokUserId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "seen" }),
        },
      );
      await loadInbox(scope, store, stores);
    },
    [api, loadThread, loadInbox, scope, store, stores],
  );

  const applyOutcome = useCallback(
    async (payload: OutcomePayload) => {
      if (!openConversation) return;
      await api(
        `/api/stores/${openConversation.storeId}/leads/${encodeURIComponent(openConversation.tiktokUserId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            closedThrough: payload.action === "close" ? openConversation.lastAt : undefined,
          }),
        },
      );
      await loadInbox(scope, store, stores);
    },
    [api, openConversation, loadInbox, scope, store, stores],
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
              {/* Alcance de tienda: distinto del filtro por live que va abajo */}
              {stores.length > 1 && (
                <div className="flex items-center gap-1 mb-3">
                  {(
                    [
                      { key: "store" as Scope, label: `@${store.tiktokUsername}` },
                      { key: "all" as Scope, label: "Todas las tiendas" },
                    ]
                  ).map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => void switchScope(option.key)}
                      className="h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-colors"
                      style={{
                        background:
                          scope === option.key ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                        color:
                          scope === option.key ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              <InboxList
                conversations={conversations}
                showStore={scope === "all"}
                onOpen={openThread}
              />
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
              onBack={() => setOpenKey(null)}
              onOutcome={applyOutcome}
              onLoadMore={() =>
                messages[0] && loadThread(openConversation, messages[0].createdAt)
              }
            />
          ) : null
        }
      />

      <Toaster richColors position="bottom-center" />
    </div>
  );
}
