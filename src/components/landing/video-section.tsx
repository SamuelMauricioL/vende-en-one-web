"use client";

import { useRef, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

export default function VideoSection() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="demo"
      ref={ref}
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white/90 tracking-tight">
            {t("video.title")}
          </h2>
          <p className="mt-4 text-white/40 text-lg max-w-xl mx-auto">
            {t("video.subtitle")}
          </p>
        </div>

        <div
          className={`relative rounded-2xl overflow-hidden transition-all duration-1000 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{
            aspectRatio: "16/9",
            background: "linear-gradient(135deg, rgba(37,244,238,0.05), rgba(254,44,85,0.05))",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 0 80px rgba(254,44,85,0.06)",
          }}
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 25% 25%, rgba(254,44,85,0.5) 0%, transparent 50%),
                  radial-gradient(circle at 75% 75%, rgba(37,244,238,0.5) 0%, transparent 50%)
                `,
              }}
            />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <video
              className="w-full h-full object-cover hidden"
              autoPlay
              muted
              loop
              playsInline
              id="demo-video"
            />

            <div className="flex flex-col items-center gap-6 text-center px-8">
              <div className="flex items-end gap-1 h-16">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full"
                    style={{
                      height: `${40 + ((i * 37 + 13) % 60)}%`,
                      backgroundColor: i % 2 === 0 ? "#fe2c55" : "#25f4ee",
                      opacity: 0.3,
                      animation: `waveform 1.5s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>

              <div>
                <p className="text-white/60 text-sm font-medium">
                  {t("video.placeholder")}
                </p>
                <p className="text-white/20 text-xs mt-1">
                  {t("video.hint")}
                </p>
              </div>

              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(254,44,85,0.15)",
                  border: "1px solid rgba(254,44,85,0.2)",
                }}
              >
                <svg
                  className="w-6 h-6 text-[#fe2c55] ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0b0f1a]/80 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="w-1/3 h-full rounded-full bg-[#fe2c55]/50" />
              </div>
              <span className="text-xs text-white/40 font-mono">--:--</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/20">
          {t("video.caption")}
        </p>
      </div>

      <style jsx>{`
        @keyframes waveform {
          0%, 100% { transform: scaleY(0.5); opacity: 0.2; }
          50% { transform: scaleY(1); opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}
