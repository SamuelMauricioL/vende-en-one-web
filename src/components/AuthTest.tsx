"use client";

import { useAuth } from "@clerk/astro/react";
import { useI18n } from "@/lib/i18n/context";

export default function AuthTest() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { t } = useI18n();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "#0b0f1a" }}
    >
      <h1 className="text-3xl font-extrabold text-white">
        Auth + I18n Test
      </h1>
      <p className="text-white/60">
        isLoaded: {isLoaded ? "✅" : "⏳"} | isSignedIn: {isSignedIn ? "✅" : "❌"}{" "}
        | userId: {userId || "null"}
      </p>
      <p className="text-white/40 text-sm">{t("nav.demo")}</p>
    </div>
  );
}
