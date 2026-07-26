"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";

const STAGES_Y = [0, 20, 38, 56, 74];
const STAGE_NAMES = ["funnel.stage.0", "funnel.stage.1", "funnel.stage.2", "funnel.stage.3", "funnel.stage.4"];
const STAGE_PCTS = ["funnel.pct.0", "funnel.pct.1", "funnel.pct.2", "funnel.pct.3", "funnel.pct.4"];
const STAGE_COLORS = ["#25f4ee", "#4ade80", "#facc15", "#fb923c", "#fe2c55"];
const FUNNEL_WIDTHS = [85, 68, 50, 34, 18];

// Funnel SVG edges at each stage (percentage of container width)
// SVG polygon: 30,0 370,0 310,480 90,480 → left edge: 7.5 + y*0.15, right: 92.5 - y*0.15
const FUNNEL_LEFTS = STAGES_Y.map((y) => 7.5 + y * 0.15);
const FUNNEL_RIGHTS = STAGES_Y.map((y) => 92.5 - y * 0.15);

// Hot zone at the bottom: only this narrow band yields survivors
const HOT_ZONE_CENTER = 50;
const HOT_ZONE_HALF = 9; // 18% total width → ±9% around center

const ELIMINATION_RATES = [0, 0.55, 0.55, 0.55, 0.7];

interface Ball {
  id: number;
  x: number;
  y: number;
  speed: number;
  stage: number;
  eliminated: boolean;
  eliminatedAt: number;
  eliminatedText: string;
  size: number;
}

interface LostText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
}

export default function FunnelAnimation() {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [lostTexts, setLostTexts] = useState<LostText[]>([]);
  const animRef = useRef<number>(0);
  const ballIdRef = useRef(0);
  const textIdRef = useRef(0);
  const spawnedRef = useRef(false);

  const makeBall = useCallback((yOffset = 0) => ({
    id: ballIdRef.current++,
    x: 12 + Math.random() * 76,
    y: -5 - Math.random() * yOffset,
    speed: 0.3 + Math.random() * 0.5,
    stage: 0,
    eliminated: false,
    eliminatedAt: 0,
    eliminatedText: "",
    size: 5 + Math.random() * 3,
  }), []);

  const addLostText = useCallback((x: number, y: number, stage: number) => {
    const text = stage >= 4 ? "cliente -1" : "✕";
    const color = stage >= 4 ? "#fe2c55" : "rgba(255,255,255,0.3)";
    setLostTexts((prev) => [...prev, {
      id: textIdRef.current++,
      x,
      y,
      text,
      color,
      createdAt: Date.now(),
    }]);
  }, []);

  useEffect(() => {
    if (spawnedRef.current) return;
    spawnedRef.current = true;
    const initial: Ball[] = [];
    for (let i = 0; i < 80; i++) initial.push(makeBall(Math.random() * 15));
    setBalls(initial);
  }, [makeBall]);

  useEffect(() => {
    setMounted(true);

    const tick = () => {
      setBalls((prev) => {
        const next = prev
          .map((b) => {
            if (b.eliminated) {
              if (Date.now() - b.eliminatedAt > 1500) return null;
              // Float the eliminated ball text upward
              return { ...b, y: b.y - 0.08 };
            }

            let newY = b.y + b.speed;
            let newStage = b.stage;
            let eliminated = false;

            // Check stage transitions
            for (let s = b.stage + 1; s < STAGES_Y.length; s++) {
              if (newY >= STAGES_Y[s] && b.stage < s) {
                newStage = s;
                if (s > 0 && Math.random() < ELIMINATION_RATES[s]) {
                  eliminated = true;
                }
                break;
              }
            }

            // In the final stage, keep rolling for elimination
            if (!eliminated && newStage >= 4 && newY > STAGES_Y[4] && newY < 82) {
              if (Math.random() < 0.03) {
                eliminated = true;
              }
            }

            if (eliminated) {
              addLostText(b.x, Math.min(newY, STAGES_Y[Math.min(newStage, STAGES_Y.length - 1)] + 3), newStage);
              return {
                ...b,
                stage: newStage,
                eliminated: true,
                eliminatedAt: Date.now(),
                eliminatedText: newStage >= 4 ? "cliente -1" : "✕",
                y: Math.min(newY, STAGES_Y[Math.min(newStage, STAGES_Y.length - 1)] + 3),
              };
            }

            // Reached bottom — check if within hot zone
            if (newY > 82) {
              const inHotZone =
                b.x >= HOT_ZONE_CENTER - HOT_ZONE_HALF &&
                b.x <= HOT_ZONE_CENTER + HOT_ZONE_HALF;

              if (!inHotZone) {
                addLostText(b.x, 82, 4);
                return {
                  ...b,
                  y: 82,
                  stage: 4,
                  eliminated: true,
                  eliminatedAt: Date.now(),
                  eliminatedText: "cliente -1",
                };
              }

              // SURVIVOR — within the hot zone
              return {
                ...b,
                y: 82 + (b.id % 3),
                stage: 4,
                speed: 0,
              };
            }

            return {
              ...b,
              y: newY,
              stage: newStage,
              // Pull toward center more aggressively near the bottom
              x: b.x + (50 - b.x) * (0.002 + Math.max(0, newY - 50) * 0.0003),
            };
          })
          .filter(Boolean) as Ball[];

        if (next.length < 120 && Math.random() < 0.15) {
          next.push(makeBall());
        }

        return next;
      });

      // Clean old lost texts
      setLostTexts((prev) => prev.filter((lt) => Date.now() - lt.createdAt < 2500));

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [makeBall, addLostText]);

  if (!mounted) {
    return (
      <div ref={containerRef} className="relative w-full max-w-4xl mx-auto py-16">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto py-16" id="funnel">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white/90 tracking-tight">
          {t("funnel.title")}
        </h2>
        <p className="mt-4 text-white/40 text-lg max-w-xl mx-auto">
          {t("funnel.subtitle")}
        </p>
      </div>

      <h3 className="text-center text-sm font-semibold tracking-widest uppercase text-white/40 mb-12">
        {t("funnel.badge")}
      </h3>

      <div className="relative flex flex-col items-center">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 500"
          preserveAspectRatio="xMidYMid meet"
          style={{ filter: "drop-shadow(0 0 40px rgba(254,44,85,0.08))" }}
        >
          <defs>
            <linearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#25f4ee" stopOpacity="0.08" />
              <stop offset="40%" stopColor="#4ade80" stopOpacity="0.06" />
              <stop offset="70%" stopColor="#fb923c" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#fe2c55" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <polygon
            points="30,0 370,0 310,480 90,480"
            fill="url(#funnelGrad)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          {STAGES_Y.map((y, i) => {
            if (i === 0) return null;
            const pct = y / 100;
            return (
              <line
                key={i}
                x1={30 + pct * 60}
                y1={y * 4.8}
                x2={370 - pct * 60}
                y2={y * 4.8}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}
        </svg>

        <div className="relative w-full" style={{ height: 500 }}>
          {/* Balls */}
          {balls.map((b) => {
            const stageIdx = Math.min(b.stage, STAGE_COLORS.length - 1);
            const isSurvivor = !b.eliminated && b.stage === 4 && b.speed === 0;
            const color = b.eliminated ? "rgba(255,255,255,0.15)" : STAGE_COLORS[stageIdx];
            const opacity = b.eliminated
              ? Math.max(0, 1 - (Date.now() - b.eliminatedAt) / 1500)
              : isSurvivor ? 1 : 0.7;

            // Show elimination text when fading
            if (b.eliminated && b.eliminatedText) {
              const textOpacity = Math.max(0, 1 - (Date.now() - b.eliminatedAt) / 1500);
              return (
                <div
                  key={b.id}
                  className="absolute pointer-events-none text-center"
                  style={{
                    left: `calc(50% + ${b.x - 50}%)`,
                    top: `${b.y}%`,
                    transform: "translate(-50%, -50%)",
                    opacity: textOpacity,
                  }}
                >
                  <span
                    className="text-[10px] font-bold whitespace-nowrap"
                    style={{ color: b.eliminatedText === "cliente -1" ? "#fe2c55" : "rgba(255,255,255,0.3)" }}
                  >
                    {b.eliminatedText}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={b.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: isSurvivor ? 10 : b.size,
                  height: isSurvivor ? 10 : b.size,
                  left: `calc(50% + ${b.x - 50}%)`,
                  top: `${b.y}%`,
                  backgroundColor: color,
                  opacity: opacity,
                  transform: `translate(-50%, -50%) scale(${isSurvivor ? 1.3 : 1})`,
                  boxShadow: isSurvivor
                    ? "0 0 12px #fe2c55, 0 0 30px #fe2c5580"
                    : "none",
                }}
              />
            );
          })}

          {/* Floating lost client texts */}
          {lostTexts.map((lt) => {
            const age = Date.now() - lt.createdAt;
            const opacity = Math.max(0, 1 - age / 2500);
            const floatY = lt.y - (age / 2500) * 8;
            return (
              <div
                key={lt.id}
                className="absolute pointer-events-none"
                style={{
                  left: `calc(50% + ${lt.x - 50}%)`,
                  top: `${floatY}%`,
                  transform: "translate(-50%, -50%)",
                  opacity,
                  transition: "none",
                }}
              >
                <span
                  className="text-xs font-bold whitespace-nowrap tracking-wide"
                  style={{ color: lt.color }}
                >
                  {lt.text}
                </span>
              </div>
            );
          })}

          {/* Stage labels */}
          {STAGE_NAMES.map((key, i) => {
            return (
              <div
                key={key}
                className="absolute"
                style={{
                  top: `${STAGES_Y[i]}%`,
                  left: `${FUNNEL_LEFTS[i]}%`,
                  width: `${FUNNEL_RIGHTS[i] - FUNNEL_LEFTS[i]}%`,
                }}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: STAGE_COLORS[i] }}
                    />
                    <span
                      className="text-sm font-medium text-white/70 whitespace-nowrap"
                      style={{ textShadow: "0 0 20px rgba(0,0,0,0.5)" }}
                    >
                      {t(key as any)}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold shrink-0 ml-2"
                    style={{ color: STAGE_COLORS[i] }}
                  >
                    {t(STAGE_PCTS[i] as any)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#fe2c55]/10 border border-[#fe2c55]/20">
          <div className="w-2 h-2 rounded-full bg-[#fe2c55] animate-pulse shrink-0" />
          <span className="text-sm text-[#fe2c55] font-medium">
            {t("funnel.bottom")}
          </span>
        </div>
      </div>
    </div>
  );
}
