"use client";

import type { WaitlistLandingContent } from "@/lib/waitlist-landing/content";
import { primaryButton, primaryStyle } from "./landing-ui";

/**
 * S11 de `odd/tasks/landing-waitlist.md`: las 4 anclas del demo, pegadas bajo
 * el `Navbar` (h-16). En móvil quedan solo las tres primeras ocultas y el CTA.
 */
export function WaitlistAnchorStrip({ anchors }: { anchors: WaitlistLandingContent["anchors"] }) {
  const primary = anchors[anchors.length - 1];
  const links = anchors.slice(0, -1);

  return (
    <nav
      aria-label="Principal"
      className="sticky top-16 z-40 border-b border-white/[0.04] bg-[#0b0f1a]/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="hidden items-center gap-6 sm:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg text-sm text-white/40 transition-colors hover:text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/50"
            >
              {link.label}
            </a>
          ))}
        </div>
        <a
          href={primary.href}
          className={`${primaryButton} ml-auto h-9 px-4 text-[13px]`}
          style={primaryStyle}
        >
          {primary.label}
        </a>
      </div>
    </nav>
  );
}
