import Link from "next/link";
import Navbar from "@/components/landing/navbar";
import HeroSection from "@/components/landing/hero";
import FunnelAnimation from "@/components/landing/funnel-animation";
import VideoSection from "@/components/landing/video-section";
import FeaturesSection from "@/components/landing/features";
import CTASection from "@/components/landing/cta-section";
import Footer from "@/components/landing/footer";
import { I18nProvider } from "@/lib/i18n/context";

export default function Home() {
  return (
    <I18nProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <FunnelAnimation />
          <VideoSection />
          <FeaturesSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </I18nProvider>
  );
}
