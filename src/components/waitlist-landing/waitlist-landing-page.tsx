"use client";

import { FaqList } from "@/components/faq-list";
import { WaitlistForm } from "@/components/waitlist-form";
import { useI18n } from "@/lib/i18n/context";
import { waitlistContent } from "@/lib/waitlist-landing/content";
import { WaitlistHeader } from "./waitlist-header";
import { WaitlistContact } from "./waitlist-contact";
import { WaitlistPerms } from "./waitlist-perms";
import { WaitlistSlider } from "./waitlist-slider";
import { WaitlistSteps } from "./waitlist-steps";
import {
  accentText,
  ghostButton,
  ghostStyle,
  monoLabel,
  primaryButton,
  primaryStyle,
  sectionClass,
} from "./landing-ui";

const DEMO_URL = "https://www.tiktoklive.me/app";

export function WaitlistLandingPage() {
  const { locale } = useI18n();
  const content = waitlistContent[locale];
  const { hero, demo, faq, footer } = content;

  return (
    <div>
      {}
      <WaitlistHeader anchors={content.anchors} />

      <main id="top">

      {}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top, rgba(254,44,85,0.10) 0%, transparent 65%)" }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
            <div>
              <span className={`${monoLabel} inline-flex items-center gap-2.5`}>
                <i
                  aria-hidden="true"
                  className="block h-2 w-2 rounded-full bg-[#25f4ee] animate-pulse motion-reduce:animate-none"
                />
                {hero.eyebrow}
              </span>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white/90">
                {hero.title} <span style={accentText}>{hero.titleAccent}</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/40">{hero.lead}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#waitlist" className={primaryButton} style={primaryStyle}>
                  {hero.primary}
                </a>
                <a href={DEMO_URL} target="_blank" rel="noopener" className={ghostButton} style={ghostStyle}>
                  {hero.secondary}
                </a>
              </div>
              <p className="mt-4 font-mono text-[13px] text-white/25">{hero.note}</p>
            </div>

            <WaitlistSlider copy={content.product} />
          </div>
        </div>
      </section>

      {}
      <section id="demo" className="relative overflow-hidden scroll-mt-24">
        <img
          src="/landing/demo-bg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,15,26,0.94) 0%, rgba(11,15,26,0.90) 45%, rgba(11,15,26,0.97) 100%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className={monoLabel}>{demo.eyebrow}</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white/90">
              {demo.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/40">{demo.lead}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={DEMO_URL} target="_blank" rel="noopener" className={primaryButton} style={primaryStyle}>
                {demo.primary}
              </a>
              <a href="#waitlist" className={ghostButton} style={ghostStyle}>
                {demo.secondary}
              </a>
            </div>
            <p className="mt-4 font-mono text-[13px] text-white/25">{demo.note}</p>
          </div>
        </div>
      </section>

      {}
      <WaitlistSteps copy={content.steps} />

      {}
      <section className={sectionClass}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          <WaitlistForm copy={content.waitlist} />
          <WaitlistPerms copy={content.tiktok} />
        </div>
      </section>

      {}
      <section id="faq" className={sectionClass}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <span className={monoLabel}>{faq.eyebrow}</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white/90">
              {faq.title}
            </h2>
          </div>
          <div className="mt-6 max-w-3xl">
            <FaqList items={faq.items} />
          </div>
        </div>
      </section>

      {}
      <WaitlistContact copy={content.contact} />

      {}
      </main>

      <footer className="border-t border-white/[0.04] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <strong className="text-sm font-bold text-white/90">{footer.brand}</strong>
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              {footer.madeWithLead}
              <svg aria-label={footer.heartLabel} role="img" width="14" height="14" viewBox="0 0 24 24">
                <path
                  fill="#fe2c55"
                  d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 5 6 5c2 0 3.4 1.1 4.2 2.4h3.6C14.6 6.1 16 5 18 5c3.3 0 5.1 3.4 3.6 6.8C19.5 16.4 12 21 12 21z"
                />
              </svg>
              {footer.madeWithTail}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {footer.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg text-xs text-white/30 transition-colors hover:text-white/60 outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/50"
              >
                {link.label}
              </a>
            ))}
            {
}
            <a
              href="/privacy"
              className="rounded-lg text-xs text-white/30 transition-colors hover:text-white/60 outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/50"
            >
              Privacidad
            </a>
            <a
              href="/terms"
              className="rounded-lg text-xs text-white/30 transition-colors hover:text-white/60 outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/50"
            >
              Términos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
