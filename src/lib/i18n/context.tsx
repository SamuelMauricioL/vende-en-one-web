"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { es, en, type Locale, type TranslationKey } from "./translations";

type I18nContext = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  toggleLocale: () => void;
};

const ctx = createContext<I18nContext | null>(null);

const messages: Record<Locale, Record<TranslationKey, string>> = { es, en };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("es");

  const t = useCallback(
    (key: TranslationKey): string => messages[locale][key] ?? key,
    [locale]
  );

  const toggleLocale = useCallback(() => {
    setLocale((prev) => (prev === "es" ? "en" : "es"));
  }, []);

  return (
    <ctx.Provider value={{ locale, setLocale, t, toggleLocale }}>
      {children}
    </ctx.Provider>
  );
}

export function useI18n() {
  const context = useContext(ctx);
  if (!context) {
    // SSR fallback — Astro islands render independently, context may not be available
    return {
      locale: "es" as Locale,
      setLocale: () => {},
      t: (key: TranslationKey): string => (messages.es[key] ?? key),
      toggleLocale: () => {},
    };
  }
  return context;
}
