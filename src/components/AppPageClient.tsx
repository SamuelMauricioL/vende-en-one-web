"use client";

import { useRef, useState, useCallback } from "react";
import {
  LiveController,
  type LiveControllerHandle,
} from "@/components/live-controller";
import { Toaster } from "@/components/ui/sonner";
import { AppNav } from "@/components/app-nav";

export default function AppPageClient() {
  const controllerRef = useRef<LiveControllerHandle>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const handleActiveChange = useCallback((active: boolean) => {
    setSessionActive(active);
  }, []);

  return (
    <div
      className="h-dvh flex flex-col"
      style={{ backgroundColor: "#0b0f1a" }}
    >
      <AppNav
        current="live"
        stopButton={
          sessionActive ? (
            <button
              type="button"
              onClick={() => controllerRef.current?.handleStop()}
              disabled={controllerRef.current?.loading}
              className="md:hidden h-8 px-3 border border-white/20 text-white/70 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
            >
              {controllerRef.current?.loading
                ? "Deteniendo..."
                : "Detener"}
            </button>
          ) : undefined
        }
      />
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 max-w-6xl w-full mx-auto">
          <LiveController
            ref={controllerRef}
            onActiveChange={handleActiveChange}
          />
        </div>
      </main>

      <footer className="border-t border-white/[0.04] py-3 shrink-0 max-md:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center flex items-center justify-center gap-4">
          <span className="text-[10px] text-white/20">
            Live Leads &copy; {new Date().getFullYear()}
          </span>
          <span className="text-white/10 text-[10px]">&middot;</span>
          <a
            href="/privacy"
            className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
          >
            Privacidad
          </a>
          <span className="text-white/10 text-[10px]">&middot;</span>
          <a
            href="/terms"
            className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
          >
            Términos
          </a>
        </div>
      </footer>
      <Toaster richColors position="bottom-center" />
    </div>
  );
}
