"use client";

import { useState, useEffect } from "react";
import LanguageSwitcher from "./language-switcher";
import { useI18n } from "@/lib/i18n/context";
import { AuthButton } from "@/components/auth/auth-button";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/[0.04]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <img
            src="/favicon.png"
            alt="Live Leads"
            className="w-7 h-7 rounded-lg"
          />
          <span className="text-base font-bold text-white/90 tracking-wide">
            Live Leads
          </span>
        </a>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-4">
          <a
            href="#demo"
            className="text-xs text-white/40 hover:text-white/70 transition-colors tracking-wide"
          >
            {t("nav.demo")}
          </a>
          <a
            href="#features"
            className="text-xs text-white/40 hover:text-white/70 transition-colors tracking-wide"
          >
            {t("nav.features")}
          </a>
          <LanguageSwitcher />
          <AuthButton />
        </nav>

        {/* Mobile */}
        <div className="sm:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
