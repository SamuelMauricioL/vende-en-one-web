"use client";

import type { Locale } from "./translations";

/**
 * S17: un solo idioma para todas las islas. Antes cada isla tenía su propio
 * `useState` y el botón del navbar caía en el fallback de `useI18n()`, así que
 * `toggleLocale` no hacía nada y el sitio se servía siempre en `es`.
 *
 * El store es a nivel de módulo: en el navegador el módulo es uno solo, así que
 * un `setLocale` se ve en todas las islas aunque estén en árboles de React
 * distintos. En el servidor el snapshot siempre es `es` para que la hidratación
 * coincida con el HTML que se envió.
 */

const KEY = "ll-locale";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

let current: Locale = "es";
const listeners = new Set<() => void>();

/** `localStorage` puede no existir (SSR, tests) o estar bloqueado por el navegador. */
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
    // Sin persistencia el cambio sigue valiendo para esta sesión.
  }
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener());
}

/** Lo que el visitante eligió la última vez, o `null` si no hay nada válido. */
export function readStoredLocale(storage?: StorageLike | null): Locale | null {
  const target = resolveStorage(storage);
  try {
    const raw = target?.getItem(KEY);
    return raw === "es" || raw === "en" ? raw : null;
  } catch {
    return null;
  }
}
