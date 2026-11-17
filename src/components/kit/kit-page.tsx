"use client";

import { useCallback, useEffect, useState } from "react";
import { FaqList } from "@/components/faq-list";
import { useI18n } from "@/lib/i18n/context";
import { kitContent } from "@/lib/kit/content";
import { readKitState, writeKitState } from "@/lib/kit/storage";
import { KitCaptureForm } from "./kit-capture-form";
import { KitChecklist } from "./kit-checklist";
import { KitAdvice, KitCompare } from "./kit-compare";
import { KitLeadBoard } from "./kit-lead-board";
import { KitTemplates } from "./kit-templates";
import { KitVideoCarousel } from "./kit-video-carousel";

const DEMO_URL = "https://www.tiktoklive.me/app";

const TOC_ANCHORS = ["#antes", "#gancho", "#oferta", "#durante", "#despues", "#plantillas"];

const card = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const accentText = {
  backgroundImage: "linear-gradient(135deg, #fe2c55, #25f4ee)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const monoLabel = "font-mono text-[11px] uppercase tracking-[0.14em] text-white/40";

const primaryButton =
  "inline-flex items-center justify-center h-12 rounded-xl px-7 text-sm font-bold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#25f4ee]/60";
const primaryStyle = { background: "linear-gradient(135deg, #fe2c55, #e8254a)" };

const sectionClass = "py-24 sm:py-32 scroll-mt-16";

function SectionHead({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <div className="max-w-3xl">
      <span className={monoLabel}>{eyebrow}</span>
      <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white/90 tracking-tight">{title}</h2>
      <p className="mt-4 text-lg leading-relaxed text-white/40">{intro}</p>
    </div>
  );
}

export function KitPage() {
  const { locale } = useI18n();
  const content = kitContent[locale];
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(readKitState().unlocked);
  }, []);

  const unlock = useCallback(() => {
    const state = readKitState();
    writeKitState({ ...state, unlocked: true });
    setUnlocked(true);
  }, []);

  const { sections, liveLeads, videos, templates, faq, hero, form, toc, final } = content;

  return (
    <div>
      <section className="relative overflow-hidden pt-28 pb-16">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top, rgba(254,44,85,0.10) 0%, transparent 65%)" }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <header className="flex flex-wrap items-center justify-between gap-4 pb-10">
            <div className="flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold text-white"
                style={{ background: "linear-gradient(135deg, #fe2c55, #25f4ee)" }}
                aria-hidden="true"
              >
                LL
              </span>
              <span className="text-[17px] font-extrabold tracking-tight text-white/90">
                {content.header.brand}
              </span>
            </div>
            <span className={`${monoLabel} hidden sm:block`}>{content.header.tagline}</span>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-12 items-center">
            <div>
              <span className={monoLabel}>{hero.eyebrow}</span>
              <h1 className="mt-3.5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-white/90">
                {hero.title} <span style={accentText}>{hero.titleAccent}</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg sm:text-xl leading-relaxed text-white/40">{hero.lead}</p>
              <ul className="mt-6 flex flex-wrap gap-2.5 list-none p-0">
                {hero.chips.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-white/80"
                    style={card}
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>
            <KitCaptureForm form={form} onUnlocked={unlock} />
          </div>
        </div>
      </section>

      <nav aria-label={toc.title} className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl p-6 sm:p-8" style={card}>
          <h2 className={monoLabel}>{toc.title}</h2>
          <ol className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {toc.items.map((item, index) => (
              <li key={item}>
                <a
                  href={TOC_ANCHORS[index]}
                  className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-[15px] text-white/70 transition-colors hover:bg-white/[0.03] hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/50"
                >
                  <span className="font-mono text-xs text-[#fe2c55] tabular-nums pt-0.5">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <section id="antes" className={sectionClass}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHead {...sections.before} />
          <div className="mt-8 max-w-3xl space-y-5">
            {sections.before.checklist ? (
              <KitChecklist group="a" checklist={sections.before.checklist} />
            ) : null}
            {sections.before.advice ? <KitAdvice advice={sections.before.advice} /> : null}
          </div>
        </div>
      </section>

      <section id="gancho" className={sectionClass}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHead {...sections.hook} />
          <div className="mt-8 max-w-3xl space-y-5">
            <KitCompare compare={sections.hook.compare} />
            {sections.hook.advice ? <KitAdvice advice={sections.hook.advice} /> : null}
          </div>
        </div>
      </section>

      <section id="oferta" className={sectionClass}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHead {...sections.offer} />
          <div className="mt-8 max-w-3xl space-y-5">
            {sections.offer.checklist ? (
              <KitChecklist group="b" checklist={sections.offer.checklist} />
            ) : null}
            {sections.offer.advice ? <KitAdvice advice={sections.offer.advice} /> : null}
          </div>
        </div>
      </section>

      <section id="durante" className={sectionClass}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHead {...sections.during} />
          <div className="mt-8 max-w-3xl">
            {sections.during.checklist ? (
              <KitChecklist group="c" checklist={sections.during.checklist} />
            ) : null}
          </div>

          <div className="mt-16">
            <h3 className="text-center text-2xl sm:text-4xl font-extrabold uppercase leading-tight tracking-tight text-white/90 text-balance">
              {liveLeads.warnTitle} <span style={accentText}>{liveLeads.warnAccent}</span>
            </h3>

            <div
              className="mx-auto mt-8 max-w-3xl rounded-3xl p-6 sm:p-8"
              style={{
                ...card,
                backgroundImage: "radial-gradient(circle at 100% -20%, rgba(254,44,85,0.10), transparent 70%)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold text-white"
                  style={{ background: "linear-gradient(135deg, #fe2c55, #25f4ee)" }}
                  aria-hidden="true"
                >
                  LL
                </span>
                <span className={monoLabel}>{liveLeads.badge}</span>
              </div>
              <h3 className="mt-3.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white/90">
                {liveLeads.title} <span style={accentText}>{liveLeads.titleAccent}</span>
              </h3>
              <p className="mt-2.5 max-w-2xl leading-relaxed text-white/40">{liveLeads.subtitle}</p>

              <ol className="mt-6 grid gap-3 sm:grid-cols-3 list-none p-0">
                {liveLeads.steps.map((step, index) => (
                  <li key={step.title} className="rounded-2xl p-4" style={{ background: "rgba(11,15,26,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span
                      className="mb-2.5 grid h-[30px] w-[30px] place-items-center rounded-full text-sm font-extrabold text-white"
                      style={{ background: "linear-gradient(135deg, #fe2c55, #e8254a)" }}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <b className="block text-[15px] font-bold text-white/90">{step.title}</b>
                    <span className="mt-1 block text-[15px] leading-relaxed text-white/40">{step.text}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6">
                <KitLeadBoard board={liveLeads.board} />
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {[liveLeads.limits.does, liveLeads.limits.doesNot].map((limit) => (
                  <div
                    key={limit.label}
                    className="rounded-xl px-3.5 py-3 text-sm leading-relaxed text-white/40"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <b className="font-bold text-white/90">{limit.label}</b> {limit.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="videos" className="mt-16 scroll-mt-16">
            <h3 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-white/90">
              {videos.title} <span style={accentText}>{videos.titleAccent}</span>
            </h3>
            <p className="mx-auto mt-2.5 max-w-xl text-center text-[15.5px] leading-relaxed text-white/40">
              {videos.subtitle}
            </p>
            <div className="mx-auto mt-6 max-w-3xl">
              <KitVideoCarousel videos={videos} />
            </div>
            <div className="mt-6 text-center">
              <a href={DEMO_URL} target="_blank" rel="noopener" className={primaryButton} style={primaryStyle}>
                {videos.cta}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="despues" className={sectionClass}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHead {...sections.after} />
          <div className="mt-8 max-w-3xl">
            {sections.after.checklist ? (
              <KitChecklist group="d" checklist={sections.after.checklist} />
            ) : null}
          </div>
        </div>
      </section>

      <section id="plantillas" className={sectionClass}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <span className={monoLabel}>{templates.eyebrow}</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white/90 tracking-tight">
              {templates.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/40">
              {templates.introLead}
              <span className="font-bold text-[#25f4ee]">{templates.introAccent}</span>
              {templates.introTail}
            </p>
          </div>
          <div className="mt-8 max-w-3xl">
            <KitTemplates unlocked={unlocked} />
          </div>
        </div>
      </section>

      <section id="faq" className={sectionClass}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white/90 tracking-tight">{faq.title}</h2>
          <div className="mt-6 max-w-3xl">
            <FaqList items={faq.items} />
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div
            className="rounded-3xl px-6 py-12 sm:px-12 text-center"
            style={{
              ...card,
              backgroundImage: "radial-gradient(circle at 50% -40%, rgba(254,44,85,0.10), transparent 70%)",
            }}
          >
            <span className={monoLabel}>{final.eyebrow}</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white/90">
              {final.title} <span style={accentText}>{final.titleAccent}</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl leading-relaxed text-white/40">{final.lead}</p>
            <a
              href={DEMO_URL}
              target="_blank"
              rel="noopener"
              className={`${primaryButton} mt-6`}
              style={primaryStyle}
            >
              {final.cta}
            </a>
          </div>

          <p className="mt-8 border-t border-white/[0.04] pt-8 text-center text-xs text-white/30">
            {content.footer}
          </p>
        </div>
      </section>
    </div>
  );
}
