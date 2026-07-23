"use client";

import Script from "next/script";

const PLAUSIBLE_SCRIPT_URL =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL ||
  "https://plausible.io/js/script.js";
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "";

export function PlausibleProvider({ children }: { children: React.ReactNode }) {
  if (!PLAUSIBLE_DOMAIN) return <>{children}</>;

  return (
    <>
      <Script
        defer
        data-domain={PLAUSIBLE_DOMAIN}
        src={PLAUSIBLE_SCRIPT_URL}
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
