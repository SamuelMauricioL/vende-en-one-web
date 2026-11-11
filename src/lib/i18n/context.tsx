"use client";

import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { es, en, type Locale, type TranslationKey } from "./translations";
import { getLocale, readStoredLocale, setLocale, subscribe } from "./locale-store";

type I18nContext = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  toggleLocale: () => void;
};

const messages: Record<Locale, Record<TranslationKey, string>> = { es, en };

/**
 * S17 de `odd/tasks/kit-live-sin-improvisar.md`: el idioma vive en un store de
 * módulo, no en `useState`. Astro monta cada isla como un árbol de React
 * propio, así que un proveedor de contexto nunca alcanza a las islas hermanas
 * y el botón del navbar quedaba sin efecto. `useSyncExternalStore` sí comparte
 * el valor entre islas y el snapshot del servidor es `es` para hidratar igual
 * que el HTML enviado.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useI18n(): I18nContext {
  const locale = useSyncExternalStore(subscribe, getLocale, () => "es" as Locale);

  // La elección guardada se aplica después de montar: leerla antes rompería la
  // hidratación cuando el HTML se generó en el servidor con `es`.
  useEffect(() => {
    const stored = readStoredLocale();
    if (stored) setLocale(stored);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => messages[locale][key] ?? key,
    [locale],
  );

  const change = useCallback((next: Locale) => setLocale(next), []);

  const toggleLocale = useCallback(
    () => setLocale(getLocale() === "es" ? "en" : "es"),
    [],
  );

  return { locale, setLocale: change, t, toggleLocale };
}
