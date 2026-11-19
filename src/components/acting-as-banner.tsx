"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ACTING_EVENT,
  clearActing,
  formatCountdown,
  readActing,
  type ActingState,
} from "@/lib/acting";

const ADMIN_PATH = "/app/admin";

export default function ActingAsBanner() {
  const [acting, setActing] = useState<ActingState | null>(null);
  const [remaining, setRemaining] = useState(0);

  const sync = useCallback(() => {
    const state = readActing();
    setActing(state);
    setRemaining(state ? state.expiresAt - Date.now() : 0);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(ACTING_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ACTING_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  useEffect(() => {
    if (!acting) return;

    const tick = () => {
      const left = acting.expiresAt - Date.now();
      if (left <= 0) {
        clearActing();
        setActing(null);
        setRemaining(0);
        return;
      }
      setRemaining(left);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [acting]);

  const exit = useCallback(() => {
    clearActing();
    setActing(null);
    setRemaining(0);
    window.location.href = ADMIN_PATH;
  }, []);

  if (!acting) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-2 shrink-0 rounded-xl border p-2.5"
      style={{
        backgroundColor: "rgba(250,204,21,0.1)",
        borderColor: "rgba(250,204,21,0.28)",
      }}
    >
      <div className="flex flex-col gap-2">
        <p className="text-[11px] leading-relaxed text-white/70">
          Actuando como{" "}
          <span className="font-semibold text-white/95">@{acting.handle}</span>
          <span className="ml-2 rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-white/80">
            {formatCountdown(remaining)}
          </span>
          <span className="mt-1 block text-white/40">
            No eres tú: los datos y las acciones son de esta cuenta.
          </span>
        </p>
        <button
          type="button"
          onClick={exit}
          className="h-8 w-full rounded-lg text-[11px] font-semibold text-white transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#fe2c55]/60"
          style={{ backgroundColor: "#fe2c55" }}
        >
          Salir
        </button>
      </div>
    </div>
  );
}
