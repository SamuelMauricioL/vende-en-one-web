"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import TikTokChatCarousel from "./tiktok-chat-carousel";

function useRotatingWord(t: ReturnType<typeof useI18n>["t"]) {
  const [wordIndex, setWordIndex] = useState(0);
  const [show, setShow] = useState(true);
  const words = [
    t("hero.words.0"),
    t("hero.words.1"),
    t("hero.words.2"),
    t("hero.words.3"),
    t("hero.words.4"),
  ];

  useEffect(() => {
    const iv = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length);
        setShow(true);
      }, 400);
    }, 2500);
    return () => clearInterval(iv);
  }, [words.length]);

  return { word: words[wordIndex], show };
}

export default function HeroSection() {
  const { t } = useI18n();
  const { word, show } = useRotatingWord(t);
  const ref = useRef<HTMLDivElement>(null);
  const [carouselMounted, setCarouselMounted] = useState(false);
  const [viewers, setViewers] = useState(254);

  useEffect(() => {
    setCarouselMounted(true);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        setViewers((prev) => {
          const delta = (Math.floor(Math.random() * 5) + 1) * 10;
          const dir = Math.random() > 0.5 ? 1 : -1;
          const next = prev + delta * dir;
          return Math.max(673, Math.min(1200, next));
        });
        schedule();
      }, 3000 + Math.random() * 2500);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#fe2c55]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#25f4ee]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#25f4ee] animate-pulse" />
              <span className="text-xs text-white/50 font-medium tracking-wide">
                Live Leads — {t("hero.badge")}
              </span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              <span className="text-white/90">{t("hero.headline.start")} </span>
              <span
                className={`inline-block transition-all duration-300 ${
                  show ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                style={{ color: "#fe2c55" }}
              >
                {word}
              </span>
              <br />
              <span className="text-white/90">
                {t("hero.headline.end")}
              </span>
            </h1>

            {/* Explicit purpose — visible to Google's review bot */}
            <p className="mt-4 text-sm text-white/40 max-w-lg leading-relaxed border-l-2 border-[#fe2c55]/30 pl-4">
              <strong className="text-[#fe2c55]">Live Leads</strong>{" "}
              <span className="text-white/50">es una plataforma que usa inteligencia artificial para capturar, clasificar y gestionar leads de ventas generados en transmisiones de TikTok Live, ayudando a creadores y vendedores a no perder oportunidades de venta.</span>
            </p>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-white/40 max-w-lg leading-relaxed">
              {t("hero.subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="/app"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #fe2c55, #e8254a)",
                  boxShadow: "0 8px 32px rgba(254,44,85,0.3)",
                }}
              >
                {t("hero.cta.try")}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>

              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white/70 border border-white/10 hover:bg-white/5 transition-all duration-200"
              >
                {t("hero.cta.watch")}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-16 flex items-center gap-6 text-xs text-white/20">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="w-7 h-7 rounded-full border-2 border-[#0b0f1a]"
                    style={{
                      background: `linear-gradient(135deg, hsl(${n * 70 + 30}, 70%, 50%), hsl(${n * 80 + 40}, 70%, 40%))`,
                    }}
                  />
                ))}
              </div>
              <span>{t("hero.social")}</span>
            </div>
          </div>

          {/* Right: TikTok Chat Carousel */}
          <div className="hidden lg:block relative">
            <div className="relative">
              {/* Decorative glow behind the carousel */}
              <div
                className="absolute -top-10 -right-10 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(254,44,85,0.12), transparent)" }}
              />
              <div
                className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full blur-[80px] pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(37,244,238,0.08), transparent)" }}
              />

              {/* Chat header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#fe2c55] animate-pulse" />
                  <span className="text-xs text-white/40 font-medium">
                    Chat en vivo
                  </span>
                </div>
                <span className="text-[10px] text-white/20 font-mono">
                  {viewers >= 1000
                    ? `${(viewers / 1000).toFixed(viewers % 1000 === 0 ? 0 : 1).replace(/\.0$/, "")}k`
                    : viewers} {t("chat.watching")}
                </span>
              </div>

              {/* Carousel */}
              {carouselMounted && <TikTokChatCarousel />}
            </div>

            {/* Caption */}
            <p className="mt-4 text-[11px] text-white/15 text-center">
              Así llegan los leads mientras vendes en vivo
            </p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/10">
        <span className="text-xs tracking-widest uppercase">{t("hero.scroll")}</span>
        <div className="w-4 h-7 rounded-full border border-white/10 flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-white/20 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
