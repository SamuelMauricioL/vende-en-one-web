"use client";

import { useEffect, useState } from "react";
import { pickActiveStore, type StoreOption } from "@/lib/inbox-api";

/**
 * Tienda activa compartida por todos los módulos.
 * Vive en el navegador a propósito: permite responder la tienda 3 mientras el
 * live corre en la tienda 1, incluso en la misma computadora.
 */
export const ACTIVE_STORE_KEY = "ll_active_store";
const ACTIVE_STORE_EVENT = "ll-active-store";

export function readActiveStoreId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_STORE_KEY);
  } catch {
    return null;
  }
}

export function writeActiveStoreId(storeId: string): void {
  try {
    localStorage.setItem(ACTIVE_STORE_KEY, storeId);
  } catch {
    // sin localStorage el cambio dura la sesión
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ACTIVE_STORE_EVENT));
  }
}

/** Resuelve la tienda activa: guardada → `@` del perfil → primera. */
export function resolveActiveStore<T extends StoreOption>(
  stores: T[],
  profileHandle?: string,
): T | null {
  return pickActiveStore(stores, profileHandle, readActiveStoreId());
}

/** Lee la tienda activa y se suscribe a los cambios hechos desde otra pantalla. */
export function useActiveStoreId(): string | null {
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setStoreId(readActiveStoreId());
    sync();
    window.addEventListener(ACTIVE_STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ACTIVE_STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return storeId;
}
