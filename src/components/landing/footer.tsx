"use client";

import { useI18n } from "@/lib/i18n/context";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-white/[0.04] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-[10px] shadow"
              style={{
                background: "linear-gradient(135deg, #fe2c55, #25f4ee)",
                color: "#0b0f1a",
              }}
            >
              LL
            </div>
            <span className="text-xs text-white/30 font-medium">
              Live Leads &copy; {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="/app"
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Live Controller
            </a>
            <span className="text-white/10 text-xs">—</span>
            <span className="text-xs text-white/20">
              {t("footer.tagline")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
