"use client";

import { useRef } from "react";
import { LiveController, type LiveControllerHandle } from "@/components/live-controller";
import { I18nProvider } from "@/lib/i18n/context";
import { Toaster } from "@/components/ui/sonner";

export default function AppPage() {
  const controllerRef = useRef<LiveControllerHandle>(null);

  return (
    <I18nProvider>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12">
            {/* Header with back button and mobile stop button */}
            <div className="mb-8 flex items-center gap-4">
              <a
                href="/"
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:bg-white/5 active:scale-95"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                aria-label="Volver"
              >
                <svg
                  className="w-4 h-4 text-white/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white/90 tracking-tight flex-1">
                Live Controller
              </h1>
              {controllerRef.current?.active && (
                <button
                  type="button"
                  onClick={() => controllerRef.current?.handleStop()}
                  disabled={controllerRef.current?.loading}
                  className="md:hidden h-9 px-4 border border-white/20 text-white/70 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                >
                  {controllerRef.current?.loading ? "Deteniendo..." : "Detener"}
                </button>
              )}
            </div>

            <LiveController ref={controllerRef} />
          </div>
        </main>

        {/* Simple footer */}
        <footer className="border-t border-white/[0.04] py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <span className="text-xs text-white/20">
              LiveLeads &copy; {new Date().getFullYear()}
            </span>
          </div>
        </footer>
      </div>
      <Toaster richColors position="bottom-center" />
    </I18nProvider>
  );
}
