"use client";

import { useCallback, useRef, useState } from "react";
import {
  COPY_FEEDBACK_MS,
  copyOutcome,
  type ContactRow,
} from "@/lib/waitlist-landing/contact";
import type { WaitlistLandingContent } from "@/lib/waitlist-landing/content";
import { card, ghostButton, ghostStyle, monoLabel, sectionClass } from "./landing-ui";

type Copy = WaitlistLandingContent["contact"];

const rowClass =
  "flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-[15px]";

/**
 * S8 de `odd/tasks/landing-waitlist.md`: tres filas con su etiqueta en mono.
 * «Copiar» escribe el valor completo y avisa «Copiado» (o «Selecciona y copia»
 * si el portapapeles está bloqueado) durante 1,8 s.
 */
export function WaitlistContact({ copy }: { copy: Copy }) {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, number>>({});

  const copyValue = useCallback(
    async (row: ContactRow) => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(row.value);
        ok = true;
      } catch {
        ok = false;
      }

      setLabels((prev) => ({ ...prev, [row.label]: copyOutcome(ok, copy) }));
      window.clearTimeout(timers.current[row.label]);
      timers.current[row.label] = window.setTimeout(() => {
        setLabels((prev) => {
          const next = { ...prev };
          delete next[row.label];
          return next;
        });
      }, COPY_FEEDBACK_MS);
    },
    [copy],
  );

  return (
    <section id="contacto" className={sectionClass}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className={monoLabel}>{copy.eyebrow}</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white/90">
              {copy.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/40">{copy.lead}</p>
          </div>

          <div className="space-y-2.5">
            {copy.rows.map((row) => (
              <div key={row.label} className={rowClass} style={card}>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
                  {row.label}
                </span>
                <span className="min-w-0 flex-1 truncate text-white/70 sm:text-left">{row.value}</span>
                {row.action === "copy" ? (
                  <button
                    type="button"
                    onClick={() => void copyValue(row)}
                    className={`${ghostButton} h-9 px-3.5 text-[13px]`}
                    style={ghostStyle}
                  >
                    {labels[row.label] ?? copy.copy}
                  </button>
                ) : (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener"
                    className={`${ghostButton} h-9 px-3.5 text-[13px]`}
                    style={ghostStyle}
                  >
                    {copy.chat}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
