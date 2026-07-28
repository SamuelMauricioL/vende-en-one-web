"use client";

import { useRef, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  Radio,
  Users,
  Zap,
  Filter,
  BarChart3,
  Send,
} from "lucide-react";

const ICONS = [Radio, Users, Filter, BarChart3, Zap, Send];
const FEATURE_KEYS = ["features.0.", "features.1.", "features.2.", "features.4.", "features.5.", "features.6."];
const COLORS = ["#25f4ee", "#4ade80", "#facc15", "#a78bfa", "#fe2c55", "#06d6a0"];

export default function FeaturesSection() {
  const { t } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      ref={ref}
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#fe2c55]/3 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white/90 tracking-tight">
            {t("features.title")}
          </h2>
          <p className="mt-4 text-white/40 text-lg max-w-xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.06]">
          {FEATURE_KEYS.map((key, i) => {
            const Icon = ICONS[i];
            return (
              <div
                key={key}
                className={`relative group bg-[#0b0f1a] p-8 transition-all duration-700 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS[i]}05, transparent 60%)`,
                  }}
                />

                <div className="relative z-10">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: `${COLORS[i]}15`,
                      border: `1px solid ${COLORS[i]}20`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: COLORS[i] }} />
                  </div>

                  <h3 className="text-base font-semibold text-white/80 mb-2">
                    {t(`${key}title` as any)}
                  </h3>

                  <p className="text-sm text-white/40 leading-relaxed">
                    {t(`${key}desc` as any)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
