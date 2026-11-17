"use client";

import { useEffect, useRef, useState } from "react";
import { AUTOPLAY_MS, next, prev, shouldAutoplay } from "@/lib/waitlist-landing/carousel";
import type { WaitlistLandingContent } from "@/lib/waitlist-landing/content";
import { card } from "./landing-ui";

type Copy = WaitlistLandingContent["product"];

const OBJECT_POSITION = ["50% 0%", "50% 100%", "50% 35%"];

const arrowClass =
  "absolute top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full text-lg text-white/80 transition-colors hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#25f4ee]/60";
const arrowStyle = { background: "rgba(11,15,26,0.75)", border: "1px solid rgba(255,255,255,0.10)" };

export function WaitlistSlider({ copy }: { copy: Copy }) {
  const slides = copy.slides;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!shouldAutoplay(reducedMotion, paused)) return;
    const timer = window.setInterval(() => setIndex((current) => next(current, slides.length)), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [index, paused, reducedMotion, slides.length]);

  const slide = slides[index];

  return (
    <div role="region" aria-roledescription="carrusel" aria-label={copy.label}>
      <div className="overflow-hidden rounded-3xl" style={card}>
        <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-[15px] font-bold text-white/90">{slide.title}</span>
          <span
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px] text-white/40"
            style={{ border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <i aria-hidden="true" className="block h-[7px] w-[7px] rounded-full bg-[#25f4ee]" />
            {copy.pill}
          </span>
        </div>

        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onPointerDown={(event) => {
            startX.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (startX.current === null) return;
            const distance = event.clientX - startX.current;
            startX.current = null;
            if (distance > 40) setIndex((current) => prev(current, slides.length));
            if (distance < -40) setIndex((current) => next(current, slides.length));
          }}
        >
          <div
            className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((item, position) => (
              <figure key={item.src} className="m-0 shrink-0 grow-0 basis-full">
                <img
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  fetchPriority={position === 0 ? "high" : "auto"}
                  loading={position === 0 ? "eager" : "lazy"}
                  style={{ objectPosition: OBJECT_POSITION[position] }}
                  className="block h-auto w-full"
                />
              </figure>
            ))}
          </div>

          <button
            type="button"
            aria-label={copy.prev}
            onClick={() => setIndex((current) => prev(current, slides.length))}
            className={`${arrowClass} left-2`}
            style={arrowStyle}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={copy.next}
            onClick={() => setIndex((current) => next(current, slides.length))}
            className={`${arrowClass} right-2`}
            style={arrowStyle}
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        {
}
        <div>
          {slides.map((item, position) => (
            <p
              key={item.src}
              aria-live={position === index ? "polite" : undefined}
              hidden={position !== index}
              className="text-sm leading-relaxed text-white/40"
            >
              {item.caption}
            </p>
          ))}
        </div>
        <div role="tablist" aria-label={copy.dots} className="flex shrink-0 gap-2 pt-1.5">
          {slides.map((item, position) => (
            <button
              key={item.src}
              type="button"
              role="tab"
              aria-label={item.title}
              aria-selected={position === index}
              onClick={() => setIndex(position)}
              className="h-2.5 rounded-full transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/60"
              style={{
                width: position === index ? 24 : 10,
                background: position === index ? "#fe2c55" : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
