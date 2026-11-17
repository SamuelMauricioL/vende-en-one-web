"use client";

import { useRef, useState } from "react";
import type { KitContent } from "@/lib/kit/content";

type Videos = KitContent["videos"];

const SOURCES = ["/video/kit-live-controller.mp4", "/video/kit-bandeja-rescate.mp4"];

const arrowClass =
  "w-11 h-11 rounded-full text-xl text-white/80 transition-colors hover:text-white disabled:opacity-30 disabled:cursor-default outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/60";

export function KitVideoCarousel({ videos }: { videos: Videos }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const goTo = (index: number) => {
    const total = videos.items.length;
    const next = Math.max(0, Math.min(total - 1, index));
    slideRefs.current[next]?.scrollIntoView({ inline: "center", block: "nearest" });
    setActive(next);
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const middle = track.getBoundingClientRect();
    const center = middle.left + middle.width / 2;
    let closest = 0;
    let distance = Number.POSITIVE_INFINITY;
    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;
      const rect = slide.getBoundingClientRect();
      const current = Math.abs(rect.left + rect.width / 2 - center);
      if (current < distance) {
        distance = current;
        closest = index;
      }
    });
    setActive(closest);
  };

  return (
    <div aria-roledescription="carrusel" aria-label={videos.label}>
      <div
        ref={trackRef}
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          goTo(active + (event.key === "ArrowRight" ? 1 : -1));
        }}
        className="flex gap-[18px] overflow-x-auto snap-x snap-mandatory px-1 pt-1 pb-2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[900px]:justify-center min-[900px]:overflow-visible"
      >
        {videos.items.map((item, index) => (
          <figure
            key={item.title}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            className="shrink-0 grow-0 basis-[78%] max-w-[330px] snap-center m-0 min-[900px]:basis-[330px]"
          >
            <div
              className="aspect-[9/16] overflow-hidden rounded-2xl bg-[#0b0f1a]"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <video
                ref={(node) => {
                  videoRefs.current[index] = node;
                }}
                src={SOURCES[index]}
                aria-label={item.title}
                controls
                playsInline
                preload="metadata"
                onPlay={() => {
                  videoRefs.current.forEach((other, position) => {
                    if (other && position !== index) other.pause();
                  });
                }}
                className="block w-full h-full object-cover bg-[#0b0f1a]"
              />
            </div>
            <figcaption className="mt-2.5 text-center text-[15px] font-bold text-white/90">
              {item.title}
              <span className="mt-0.5 block text-[13.5px] font-medium text-white/40">
                {item.caption}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3.5 min-[900px]:hidden">
        <button
          type="button"
          aria-label={videos.prev}
          disabled={active === 0}
          onClick={() => goTo(active - 1)}
          className={arrowClass}
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          ‹
        </button>
        <div className="flex gap-2">
          {videos.items.map((item, index) => (
            <button
              key={item.title}
              type="button"
              aria-label={item.title}
              aria-pressed={active === index}
              onClick={() => goTo(index)}
              className="h-2.5 rounded-full transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/60"
              style={{
                width: active === index ? 24 : 10,
                background: active === index ? "#fe2c55" : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={videos.next}
          disabled={active === videos.items.length - 1}
          onClick={() => goTo(active + 1)}
          className={arrowClass}
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          ›
        </button>
      </div>
    </div>
  );
}
