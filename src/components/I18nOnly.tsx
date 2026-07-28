"use client";

import { useI18n } from "@/lib/i18n/context";

export default function I18nTest() {
  const { t, locale } = useI18n();

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#0b0f1a" }}
    >
      <h1 className="text-3xl font-extrabold text-white">
        I18n Only — {locale}: {t("nav.demo")}
      </h1>
    </div>
  );
}
