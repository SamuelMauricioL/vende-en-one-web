"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { kitContent } from "@/lib/kit/content";
import { RUBRICS, kitTemplates, splitVariables, type Rubric } from "@/lib/kit/templates";

const card = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
};

export function KitTemplates({ unlocked }: { unlocked: boolean }) {
  const { locale } = useI18n();
  const content = kitContent[locale].templates;
  const messages = kitTemplates[locale];
  const [selected, setSelected] = useState<Rubric>(RUBRICS[0]);
  const [copied, setCopied] = useState<number | null>(null);
  const [fallback, setFallback] = useState<number | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const choose = (rubric: Rubric) => {
    setSelected(rubric);
    setCopied(null);
    setFallback(null);
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const total = RUBRICS.length;
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % total;
    else if (event.key === "ArrowLeft") next = (index - 1 + total) % total;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = total - 1;
    else return;
    event.preventDefault();
    choose(RUBRICS[next]);
    tabRefs.current[next]?.focus();
  };

  const copy = async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setFallback(null);
      setCopied(index);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1400);
    } catch {

      setCopied(null);
      setFallback(index);
      const paragraph = paragraphRefs.current[index];
      const selection = typeof window === "undefined" ? null : window.getSelection();
      if (!paragraph || !selection) return;
      const range = document.createRange();
      range.selectNodeContents(paragraph);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  return (
    <div className="relative">
      <div
        inert={!unlocked}
        className={unlocked ? undefined : "pointer-events-none select-none overflow-hidden max-h-[360px]"}
        style={unlocked ? undefined : { filter: "blur(7px)" }}
      >
        <div
          role="tablist"
          aria-label={content.eyebrow}
          className="flex flex-wrap gap-2"
        >
          {RUBRICS.map((rubric, index) => (
            <button
              key={rubric}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`kit-tab-${rubric}`}
              aria-selected={selected === rubric}
              aria-controls="kit-tpl-panel"
              tabIndex={selected === rubric ? 0 : -1}
              onClick={() => choose(rubric)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className="rounded-full px-4 py-2.5 text-[15px] font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#25f4ee]/60"
              style={
                selected === rubric
                  ? { background: "linear-gradient(135deg, #fe2c55, #e8254a)", color: "#fff" }
                  : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }
              }
            >
              {content.tabs[index]}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id="kit-tpl-panel"
          aria-labelledby={`kit-tab-${selected}`}
          className="mt-4 grid gap-3"
        >
          {messages[selected].map((message, index) => (
            <div key={message.text} className="rounded-2xl p-5" style={card}>
              <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
                {message.moment}
              </span>
              <p
                ref={(node) => {
                  paragraphRefs.current[index] = node;
                }}
                className="text-[15px] leading-relaxed text-white/80"
              >
                {splitVariables(message.text).map((segment, position) =>
                  segment.isVariable ? (
                    <span key={position} className="text-[#25f4ee] font-bold">
                      {segment.value}
                    </span>
                  ) : (
                    <span key={position}>{segment.value}</span>
                  ),
                )}
              </p>
              <button
                type="button"
                onClick={() => copy(index, message.text)}
                className="mt-3 inline-flex h-9 items-center rounded-xl px-3.5 text-xs font-bold text-white/80 transition-colors hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/60"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
              >
                {copied === index ? content.copied : fallback === index ? content.copyFallback : content.copy}
              </button>
            </div>
          ))}
        </div>
      </div>

      {unlocked ? null : (
        <div className="absolute inset-0 z-10 grid place-items-center p-4 text-center">
          <div
            className="max-w-sm rounded-2xl p-5"
            style={{ ...card, background: "#0b0f1a", boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}
          >
            <h3 className="text-lg font-extrabold text-white/90 tracking-tight">{content.lockedTitle}</h3>
            <p className="mt-1.5 text-sm text-white/40">{content.lockedText}</p>
            <a
              href="#captura"
              className="mt-3 inline-flex h-12 items-center justify-center rounded-xl px-5 text-sm font-bold text-white transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-[#25f4ee]/60"
              style={{ background: "linear-gradient(135deg, #fe2c55, #e8254a)" }}
            >
              {content.lockedCta}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
