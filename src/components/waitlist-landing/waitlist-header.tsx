"use client";

import LanguageSwitcher from "@/components/landing/language-switcher";
import type { WaitlistLandingContent } from "@/lib/waitlist-landing/content";
import { primaryButton, primaryStyle } from "./landing-ui";

/**
 * S11 de `odd/tasks/landing-waitlist.md`: el header del demo (marca, sus cuatro
 * anclas y el CTA) reemplaza al `Navbar` del sitio en `/waitlist`. El selector
 * ES/EN se queda dentro: sin él, el inglés de la página sería inalcanzable.
 */
export function WaitlistHeader({ anchors }: { anchors: WaitlistLandingContent["anchors"] }) {
  const primary = anchors[anchors.length - 1];
  const links = anchors.slice(0, -1);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0b0f1a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#top"
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/50"
          aria-label="Live Leads"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold text-white"
            style={{ background: "linear-gradient(135deg, #fe2c55, #25f4ee)" }}
            aria-hidden="true"
          >
            LL
          </span>
          <span className="text-[17px] font-extrabold tracking-tight text-white/90">
            Live Leads
          </span>
        </a>

        <nav aria-label="Principal" className="flex items-center gap-2 sm:gap-5">
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

          <LanguageSwitcher />

          <a
            href={primary.href}
            className={`${primaryButton} h-9 px-4 text-[13px]`}
            style={primaryStyle}
          >
            {primary.label}
          </a>
        </nav>
      </div>
    </header>
  );
}
