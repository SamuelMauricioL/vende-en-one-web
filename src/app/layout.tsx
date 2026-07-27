import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/components/auth/provider";
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
  title: "Live Leads — No pierdas clientes en tu TikTok Live",
  description:
    "Live Leads captura, filtra y clasifica leads de TikTok Live en tiempo real. IA que identifica compradores con 90% de precisión. Conecta tu TikTok Live y nunca pierdas una venta.",
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
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
        <link rel="prefetch" href="/app" />
      </body>
    </html>
  );
}
