"use client";

import type { WaitlistLandingContent } from "@/lib/waitlist-landing/content";
import { card, monoLabel, sectionClass } from "./landing-ui";

/** S4 de `odd/tasks/landing-waitlist.md`: pasos con su etiqueta por momento. */
export function WaitlistSteps({ copy }: { copy: WaitlistLandingContent["steps"] }) {
  return (
    <section id="como" className={sectionClass}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl">
          <span className={monoLabel}>{copy.eyebrow}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white/90">
            {copy.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/40">{copy.lead}</p>
        </div>

        <ol className="mt-8 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-3">
          {copy.items.map((step) => (
            <li key={step.title} className="rounded-3xl p-6" style={card}>
              <span className={monoLabel}>{step.tag}</span>
              <h3 className="mt-3 text-lg font-extrabold tracking-tight text-white/90">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/40">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
