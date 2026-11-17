"use client";

import type { Locale } from "./translations";

const KEY = "ll-locale";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

let current: Locale = "es";
const listeners = new Set<() => void>();

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function getLocale(): Locale {
  return current;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setLocale(next: Locale, storage?: StorageLike | null): void {
  const target = resolveStorage(storage);
  try {
    target?.setItem(KEY, next);
  } catch {

  }
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener());
}

export function readStoredLocale(storage?: StorageLike | null): Locale | null {
  const target = resolveStorage(storage);
  try {
    const raw = target?.getItem(KEY);
    return raw === "es" || raw === "en" ? raw : null;
  } catch {
    return null;
  }
}
