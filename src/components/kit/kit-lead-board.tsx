"use client";

import type { KitContent } from "@/lib/kit/content";

type Board = KitContent["liveLeads"]["board"];

const TAG_TONE = [
  "bg-[#fe2c55]/15 text-[#fe2c55]",
  "bg-amber-400/15 text-amber-300",
  "bg-emerald-400/15 text-emerald-300",
];

export function KitLeadBoard({ board }: { board: Board }) {
  return (
    <div
      role="img"
      aria-label={board.label}
      className="rounded-2xl p-4"
      style={{ background: "rgba(11,15,26,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#fe2c55]">
          <span className="w-2 h-2 rounded-full bg-[#fe2c55] animate-pulse" />
          {board.live}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
          {board.count}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {board.rows.map((row, index) => (
          <li
            key={row.user}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-xl px-3.5 py-3"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <b className="text-[15px] font-bold text-white/90">{row.user}</b>
            <span
              className={`row-span-2 font-mono text-[11px] uppercase tracking-[0.08em] px-2.5 py-1 rounded-lg ${
                TAG_TONE[index % TAG_TONE.length]
              }`}
            >
              {row.tag}
            </span>
            <em className="not-italic text-[15px] text-white/40">{row.text}</em>
          </li>
        ))}
      </ul>

      <span className="mt-3.5 inline-flex items-center gap-2 text-sm font-bold text-[#25f4ee]">
        {board.cta}
      </span>
      <p className="mt-2.5 text-xs text-white/40 leading-relaxed">{board.note}</p>
    </div>
  );
}
