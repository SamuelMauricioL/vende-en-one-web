"use client";

import type { Advice, KitContent } from "@/lib/kit/content";

const card = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
};

/** Las dos tarjetas «Evita / Haz esto» del demo, con los colores del sitio. */
export function KitCompare({ compare }: { compare: KitContent["sections"]["hook"]["compare"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl p-5" style={card}>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#fe2c55]">
          {compare.avoidLabel}
        </span>
        <p className="mt-2 text-[15px] text-white/40">{compare.avoid}</p>
      </div>
      <div className="rounded-2xl p-5" style={card}>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#25f4ee]">
          {compare.doLabel}
        </span>
        <p className="mt-2 text-[15px] text-white/80">{compare.do}</p>
      </div>
    </div>
  );
}

/** El consejo con la barra lateral, tal como el demo lo marca. */
export function KitAdvice({ advice }: { advice: Advice }) {
  return (
    <p className="my-5 border-l-2 border-[#25f4ee] pl-4 text-[15px] text-white/70">
      <b className="font-bold text-[#25f4ee]">{advice.label} </b>
      {advice.text}
    </p>
  );
}
