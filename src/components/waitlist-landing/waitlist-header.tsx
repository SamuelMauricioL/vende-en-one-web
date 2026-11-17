"use client";

import LanguageSwitcher from "@/components/landing/language-switcher";
import type { WaitlistLandingContent } from "@/lib/waitlist-landing/content";
import { primaryStyle } from "./landing-ui";

/**
 * S11 de `odd/tasks/landing-waitlist.md`: el header del demo (marca, sus cuatro
 * anclas y el CTA) reemplaza al `Navbar` del sitio en `/waitlist`. El selector
 * ES/EN se queda dentro: sin él, el inglés de la página sería inalcanzable.
 *
 * Responsive: en móvil el CTA baja a una segunda línea a todo el ancho
 * (`basis-full`) y las tres anclas se ocultan; la marca y el selector quedan
 * arriba. Desde `sm` todo vuelve a una sola fila de 64 px. Un solo CTA en el
 * DOM, no dos copias.
 */
export function WaitlistHeader({ anchors }: { anchors: WaitlistLandingContent["anchors"] }) {
  const primary = anchors[anchors.length - 1];
  const links = anchors.slice(0, -1);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0b0f1a]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 sm:h-16 sm:flex-nowrap sm:gap-x-5 sm:py-0">
          <a
            href="#top"
            className="mr-auto flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/50 sm:mr-0"
            aria-label="Live Leads"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
              style={{ background: "linear-gradient(135deg, #fe2c55, #25f4ee)" }}
              aria-hidden="true"
            >
              LL
            </span>
            <span className="text-[17px] font-extrabold tracking-tight text-white/90">
              Live Leads
            </span>
          </a>

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
            className="inline-flex basis-full items-center justify-center rounded-xl px-5 text-[13px] font-bold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#25f4ee]/60 h-10 sm:ml-auto sm:h-9 sm:basis-auto sm:px-4"
            style={primaryStyle}
          >
            {primary.label}
          </a>
        </div>
      </div>
    </header>
  );
}
