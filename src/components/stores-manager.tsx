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

/**
 * Capacidades que el API sirve junto al perfil (D2). El tope de tiendas es del
 * servidor: acá solo se renderiza. `null` significa "sin tope".
 */
interface CallerCapabilities {
  maxStores: number | null;
}

/** Gestión de tiendas: marcar la activa, agregar y remover. */
export default function StoresManager() {
  const { userId, isLoaded, getToken } = useAuth();
  const activeStoreId = useActiveStoreId();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  /**
   * Capacidades del perfil. `null` mientras no lleguen o si el pedido falló:
   * sin capacidades no se bloquea nada, decide el servidor.
   */
  const [caps, setCaps] = useState<CallerCapabilities | null>(null);

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

  // Rol y tope salen de la MISMA respuesta del perfil (misma fuente que el guard
  // del API): un admin no tiene tope, así que el navegador no puede bloquearle
  // el 4º alta.
  useEffect(() => {
    if (!isLoaded || !userId) return;
    let cancelled = false;
    void (async () => {
      const res = await api(`/api/users/profile/${encodeURIComponent(userId)}`);
      // Sin respuesta (fallo, 404 o 403) no inventamos capacidades: el
      // formulario queda libre y el API responde con su `message`.
      if (!res.ok) return;
      const data = (await res.json().catch(() => ({}))) as {
        profile?: { role?: string } | null;
        capabilities?: { maxStores?: unknown } | null;
      };
      if (cancelled) return;
      if (data.profile) setIsAdmin(data.profile.role === "admin");
      // `null` explícito es un tope ausente, no un tope desconocido; cualquier
      // otro valor (texto, objeto, ausente) se ignora y no bloquea nada.
      const served = data.capabilities?.maxStores;
      if (served === null) setCaps({ maxStores: null });
      else if (typeof served === "number" && Number.isFinite(served)) {
        setCaps({ maxStores: served });
      }
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

  // El tope se renderiza desde las capacidades servidas; no hay copia local que
  // pueda desincronizarse del servidor. Sin capacidades no se bloquea nada.
  const maxStores = caps === null ? null : caps.maxStores;
  const full = maxStores !== null && stores.length >= maxStores;
  const limitText =
    full && maxStores !== null ? `Llegaste al límite de ${maxStores} tiendas` : null;

  // La copia no promete un tope que el servidor no haya servido.
  const capNote =
    maxStores === null
      ? "Una tienda con lives no se puede eliminar."
      : `Hasta ${maxStores} tiendas por cuenta. Una tienda con lives no se puede eliminar.`;

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
          disabled={full}
          title={limitText ?? "Agregar una tienda nueva"}
          className="h-10 px-4 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
          style={{ background: "#fe2c55" }}
        >
          Agregar tienda
        </button>
        {limitText && <p className="text-[11px] text-[#fe2c55]">{limitText}</p>}
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
