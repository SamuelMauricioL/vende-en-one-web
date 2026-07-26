"use client";

import { useI18n } from "@/lib/i18n/context";

export default function LanguageSwitcher() {
  const { locale, toggleLocale } = useI18n();

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200"
      aria-label="Toggle language"
    >
      <span className={locale === "es" ? "text-white/80" : ""}>ES</span>
      <span className="text-white/20">/</span>
      <span className={locale === "en" ? "text-white/80" : ""}>EN</span>
    </button>
  );
}
