"use client";

import Script from "next/script";

const UMAMI_SCRIPT_URL =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ||
  "https://cloud.umami.is/script.js";
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  if (!UMAMI_WEBSITE_ID) return <>{children}</>;

  return (
    <>
      <Script
        defer
        src={UMAMI_SCRIPT_URL}
        data-website-id={UMAMI_WEBSITE_ID}
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
