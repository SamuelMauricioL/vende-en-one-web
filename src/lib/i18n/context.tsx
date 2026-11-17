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

export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useI18n(): I18nContext {
  const locale = useSyncExternalStore(subscribe, getLocale, () => "es" as Locale);

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
