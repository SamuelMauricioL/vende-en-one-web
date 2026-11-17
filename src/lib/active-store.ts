"use client";

import { useEffect, useState } from "react";
import { pickActiveStore, type StoreOption } from "@/lib/inbox-api";

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

  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ACTIVE_STORE_EVENT));
  }
}

export function resolveActiveStore<T extends StoreOption>(stores: T[]): T | null {
  return pickActiveStore(stores, readActiveStoreId());
}

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
