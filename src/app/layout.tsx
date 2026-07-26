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
  title: "LiveLeads — No pierdas clientes en tu TikTok Live",
  description:
    "Captura, filtra y sigue cada lead de tu TikTok Live. IA que identifica compradores reales con 90% de precisión. Hecho para creadores que venden en vivo.",
  openGraph: {
    title: "LiveLeads — No pierdas clientes en tu TikTok Live",
    description:
      "Captura, filtra y sigue cada lead de tu TikTok Live. IA que identifica compradores reales con 90% de precisión.",
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
      className={`dark ${jakartaSans.variable} ${jakartaMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
