"use client";

import { useI18n } from "@/lib/i18n/context";

export default function CTASection() {
  const { t } = useI18n();

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-[#fe2c55]/10 to-transparent blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white/90 tracking-tight">
          {t("cta.title")}
        </h2>

        <p className="mt-4 text-lg text-white/40 max-w-lg mx-auto">
          {t("cta.subtitle")}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/app"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #fe2c55, #e8254a)",
              boxShadow: "0 8px 40px rgba(254,44,85,0.3)",
            }}
          >
            {t("cta.button")}
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>

          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm text-white/50 border border-white/10 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
          >
            {t("cta.secondary")}
          </a>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/[0.04] pt-12">
          {[
            { value: "+50", key: "cta.stat.creators" },
            { value: "90%", key: "cta.stat.precision" },
            { value: "<2min", key: "cta.stat.setup" },
          ].map((stat) => (
            <div key={stat.key}>
              <div className="text-2xl sm:text-3xl font-extrabold text-white/80">
                {stat.value}
              </div>
              <div className="text-xs text-white/30 mt-1">{t(stat.key as any)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
