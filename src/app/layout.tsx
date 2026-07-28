import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jakartaMono = Plus_Jakarta_Sans({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Live Leads",
  description:
    "Live Leads captura, filtra y clasifica leads de TikTok Live en tiempo real. IA que identifica compradores con 90% de precisión. Conecta tu TikTok Live y nunca pierdas una venta.",
  applicationName: "Live Leads",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Live Leads — No pierdas clientes en tu TikTok Live",
    description:
      "Live Leads captura, filtra y clasifica leads de TikTok Live en tiempo real. IA que identifica compradores con 90% de precisión.",
    type: "website",
    locale: "es_PE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${jakartaSans.variable} ${jakartaMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#fe2c55",
            },
            elements: {
              card: "shadow-xl",
              socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50",
              formButtonPrimary: "bg-[#fe2c55] text-white hover:bg-[#fe2c55]/80",
            },
          }}
        >
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "Live Leads",
                applicationCategory: "BusinessApplication",
                description:
                  "Live Leads captures, filters, and classifies sales leads from TikTok Live in real-time using AI. It helps creators and sellers never miss a customer during live streams.",
                url: "https://www.tiktoklive.me",
              }),
            }}
          />
          {children}
          <Analytics />
          <link rel="prefetch" href="/app" />
        </ClerkProvider>
      </body>
    </html>
  );
}
