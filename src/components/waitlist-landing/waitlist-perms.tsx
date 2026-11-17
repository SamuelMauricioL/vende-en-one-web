"use client";

import type { WaitlistLandingContent } from "@/lib/waitlist-landing/content";
import { card, ghostButton, ghostStyle, monoLabel, primaryButton, primaryStyle } from "./landing-ui";

type Copy = WaitlistLandingContent["tiktok"];

/** El destino de la prueba: se abre aparte (S7). */
const DEMO_URL = "https://www.tiktoklive.me/app";

const tick = (
  <span
    aria-hidden="true"
    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
    style={{ background: "rgba(37,244,238,0.14)", color: "#25f4ee" }}
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  </span>
);

const cross = (
  <span
    aria-hidden="true"
    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
    style={{ background: "rgba(254,44,85,0.14)", color: "#fe2c55" }}
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  </span>
);

/**
 * S4/S7 de `odd/tasks/landing-waitlist.md`: la lista de permisos sí/no, que el
 * sitio no tenía, y los dos botones de la prueba.
 */
export function WaitlistPerms({ copy }: { copy: Copy }) {
  return (
    <div className="rounded-3xl p-6 sm:p-8" style={card}>
      <span className={monoLabel}>{copy.eyebrow}</span>
      <h2 className="mt-3.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white/90">
        {copy.title}
      </h2>
      <p className="mt-3 leading-relaxed text-white/40">{copy.lead}</p>

      <ul className="mt-5 list-none space-y-3 p-0">
        {copy.perms.map((perm) => (
          <li key={perm.lead} className="flex items-start gap-3">
            {perm.positive ? tick : cross}
            <span className="text-[15px] leading-relaxed text-white/40">
              <b className="font-bold text-white/90">{perm.lead}</b>
              {perm.text ? ` ${perm.text}` : null}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={DEMO_URL} target="_blank" rel="noopener" className={primaryButton} style={primaryStyle}>
          {copy.primary}
        </a>
        <a href="#top" className={ghostButton} style={ghostStyle}>
          {copy.exit}
        </a>
      </div>
    </div>
  );
}
