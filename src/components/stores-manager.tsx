"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { toast } from "sonner";
import { authHeaders } from "@/lib/api-auth";
import {
  readActiveStoreId,
  resolveActiveStore,
  useActiveStoreId,
  writeActiveStoreId,
} from "@/lib/active-store";

interface StoreRow {
  _id: string;
  tiktokUsername: string;
  sessions: number;
}

const MAX_STORES = 3;

/** Acepta "@cuenta", "cuenta" o el enlace del perfil, igual que el viejo CTA de Live. */
function normalizeHandle(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const fromUrl = /(?:tiktok\.com\/)@?([A-Za-z0-9._]+)/i.exec(value);
  const candidate = fromUrl ? fromUrl[1] : value.replace(/^@/, "");
  return /^[A-Za-z0-9._]{2,}$/.test(candidate) ? candidate.toLowerCase() : null;
}

/** Gestión de tiendas: marcar la activa, agregar y remover. */
export default function StoresManager() {
  const { userId, isLoaded, getToken } = useAuth();
  const activeStoreId = useActiveStoreId();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      const headers = { ...(init?.headers ?? {}), ...(await authHeaders(getToken)) };
      return fetch(path, { ...init, headers });
    },
    [getToken],
  );

  const load = useCallback(async () => {
    const res = await api("/api/stores");
    if (!res.ok) {
      setStores([]);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { stores?: StoreRow[] };
    const list = data.stores ?? [];
    setStores(list);
    setLoading(false);
    // Si no hay activa (o ya no existe), se fija la resuelta.
    if (list.length && !list.some((s) => s._id === readActiveStoreId())) {
      const resolved = resolveActiveStore(list);
      if (resolved) writeActiveStoreId(resolved._id);
    }
  }, [api]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void load();
  }, [isLoaded, userId, load]);

  const add = async () => {
    const handle = normalizeHandle(input);
    if (!handle) {
      setError("Escribe tu @ de TikTok, por ejemplo @tutienda");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await api("/api/users/profile/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiktokUsername: handle }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message || "No se pudo agregar la tienda");
        return;
      }
      setInput("");
      toast.success("Tienda agregada");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (store: StoreRow) => {
    const res = await api(`/api/stores/${store._id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      toast.error(data.message || "No se pudo eliminar la tienda");
      return;
    }
    toast.success("Tienda eliminada");
    await load();
  };

  const full = stores.length >= MAX_STORES;

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-xs text-white/30">Cargando tiendas…</p>
      ) : (
        <ul className="space-y-2">
          {stores.map((store) => {
            const active = activeStoreId === store._id;
            return (
              <li
                key={store._id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  background: active ? "rgba(254,44,85,0.08)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? "rgba(254,44,85,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => writeActiveStoreId(store._id)}
                  className="grow min-w-0 text-left"
                >
                  <span className="block text-sm font-semibold text-white/85 truncate">
                    @{store.tiktokUsername}
                  </span>
                  <span className="block text-[11px] text-white/35">
                    {store.sessions === 0
                      ? "Sin lives todavía"
                      : `${store.sessions} ${store.sessions === 1 ? "live" : "lives"}`}
                    {active ? " · activa" : ""}
                  </span>
                </button>
                {active ? (
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-md shrink-0"
                    style={{ background: "rgba(254,44,85,0.15)", color: "#fe2c55" }}
                  >
                    Activa
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => remove(store)}
                    disabled={store.sessions > 0}
                    title={
                      store.sessions > 0
                        ? "No se puede eliminar: tiene lives con historial"
                        : "Eliminar tienda"
                    }
                    className="text-[11px] text-white/30 hover:text-[#fe2c55] disabled:opacity-30 disabled:hover:text-white/30 shrink-0"
                  >
                    Eliminar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            placeholder={full ? "Llegaste al límite de 3 tiendas" : "@tutienda"}
            disabled={full || saving}
            className="flex-1 h-10 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white/85 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/40 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void add()}
            disabled={full || saving || !input.trim()}
            className="h-10 px-4 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
            style={{ background: "#fe2c55" }}
          >
            {saving ? "Agregando…" : "Agregar"}
          </button>
        </div>
        {error && <p className="text-[11px] text-[#fe2c55]">{error}</p>}
        <p className="text-[11px] text-white/25">
          Hasta {MAX_STORES} tiendas por cuenta. Una tienda con lives no se puede eliminar.
        </p>
      </div>
    </div>
  );
}
