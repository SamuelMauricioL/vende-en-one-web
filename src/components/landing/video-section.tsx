"use client";

import { useRef, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

export default function VideoSection() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          // Start playing when visible
          videoRef.current?.play().catch(() => {});
        }
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
          {/* Video */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoReady(false)}
          >
            <source src="/video/demo.mp4" type="video/mp4" />
          </video>

          {/* Loading overlay (shown until video is ready) */}
          {!videoReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0b0f1a]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
                <p className="text-xs text-white/30">Cargando video...</p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-white/20">
          {t("video.caption")}
        </p>
      </div>
    </section>
  );
}
