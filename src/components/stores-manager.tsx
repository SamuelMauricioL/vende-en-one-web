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
import AddStoreDialog from "@/components/add-store-dialog";

interface StoreRow {
  _id: string;
  tiktokUsername: string;
  sessions: number;
}

/** Tope del servidor para sellers: los admins no tienen tope (`convex/stores.ts`). */
const MAX_STORES = 3;

/** Gestión de tiendas: marcar la activa, agregar y remover. */
export default function StoresManager() {
  const { userId, isLoaded, getToken } = useAuth();
  const activeStoreId = useActiveStoreId();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  /** El rol solo se conoce si el perfil respondió; si no, decide el servidor. */
  const [roleKnown, setRoleKnown] = useState(false);

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

  // El rol vive en el perfil (misma fuente que el guard del API): un admin no
  // tiene tope de tiendas, así que el navegador no puede bloquearle el 4º alta.
  useEffect(() => {
    if (!isLoaded || !userId) return;
    let cancelled = false;
    void (async () => {
      const res = await api(`/api/users/profile/${encodeURIComponent(userId)}`);
      if (!res.ok) return;
      const data = (await res.json().catch(() => ({}))) as {
        profile?: { role?: string } | null;
      };
      // Sin perfil o sin respuesta no inventamos rol: el formulario queda libre.
      if (cancelled || !data.profile) return;
      setIsAdmin(data.profile.role === "admin");
      setRoleKnown(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, api]);

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

  // El tope del navegador es solo el de un seller confirmado; nunca contradice al
  // servidor: si el rol no se pudo leer, se deja intentar y el API responde.
  const atSellerLimit = roleKnown && !isAdmin && stores.length >= MAX_STORES;

  const capNote = isAdmin
    ? "Sin límite de tiendas para administradores. Una tienda con lives no se puede eliminar."
    : roleKnown
      ? `Hasta ${MAX_STORES} tiendas por cuenta. Una tienda con lives no se puede eliminar.`
      : "Una tienda con lives no se puede eliminar.";

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
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          disabled={atSellerLimit}
          title={
            atSellerLimit ? "Llegaste al límite de 3 tiendas" : "Agregar una tienda nueva"
          }
          className="h-10 px-4 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
          style={{ background: "#fe2c55" }}
        >
          Agregar tienda
        </button>
        {atSellerLimit && (
          <p className="text-[11px] text-[#fe2c55]">Llegaste al límite de 3 tiendas</p>
        )}
        <p className="text-[11px] text-white/25">{capNote}</p>
      </div>

      <AddStoreDialog
        open={dialogOpen}
        isAdmin={isAdmin}
        onClose={() => setDialogOpen(false)}
        onAdded={load}
      />
    </div>
  );
}
