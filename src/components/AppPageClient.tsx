"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/astro/react";
import { authHeaders } from "@/lib/api-auth";
import { resolveActiveStore, useActiveStoreId } from "@/lib/active-store";
import { fetchFilters } from "@/lib/filters-api";
import {
  LiveController,
  type LiveControllerHandle,
} from "@/components/live-controller";
import { Toaster } from "@/components/ui/sonner";
import { AppNav } from "@/components/app-nav";

type FiltersState = "loading" | "ready" | "error";

export default function AppPageClient() {
  const controllerRef = useRef<LiveControllerHandle>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const { userId, isLoaded, getToken } = useAuth();
  const [tiktokUsername, setTiktokUsername] = useState("");

  // S5: sin filtros cargados no se puede empezar el live.
  const activeStoreId = useActiveStoreId();
  const [filtersState, setFiltersState] = useState<FiltersState>("loading");
  const [filtersError, setFiltersError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Fetch TikTok username from user profile
  useEffect(() => {
    if (!isLoaded || !userId) return;
    authHeaders(getToken)
      .then((headers) => fetch(`/api/users/profile/${userId}`, { headers }))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile?.tiktokUsername) {
          setTiktokUsername(data.profile.tiktokUsername);
        }
      })
      .catch(() => {});
  }, [userId, isLoaded, getToken]);

  // Precarga de los filtros de la tienda activa y recarga al cambiarla (S1, S5).
  useEffect(() => {
    if (!isLoaded || !userId) return;
    let cancelled = false;
    setFiltersState("loading");
    setFiltersError("");

    void (async () => {
      try {
        const headers = await authHeaders(getToken);
        const res = await fetch("/api/stores", { headers });
        if (!res.ok) throw new Error("No pudimos leer tu tienda activa.");
        const data = (await res.json()) as {
          stores?: Array<{ _id: string; tiktokUsername: string }>;
        };
        const store = resolveActiveStore(data.stores ?? [], tiktokUsername);
        if (!store) throw new Error("No encontramos tu tienda activa.");
        const list = await fetchFilters(store._id, getToken);
        if (cancelled) return;
        if (list.length === 0) throw new Error("Todavía no hay filtros disponibles.");
        setFiltersState("ready");
      } catch (err) {
        if (cancelled) return;
        setFiltersError(err instanceof Error ? err.message : "");
        setFiltersState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, getToken, tiktokUsername, activeStoreId, reloadKey]);

  const handleActiveChange = useCallback((active: boolean) => {
    setSessionActive(active);
  }, []);

  const filtersReady = filtersState === "ready";

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
          {filtersReady ? (
            <LiveController
              ref={controllerRef}
              onActiveChange={handleActiveChange}
              initialTikTokUsername={tiktokUsername}
            />
          ) : (
            <div
              role="status"
              aria-live="polite"
              aria-busy={filtersState === "loading"}
              className="h-full flex flex-col items-center justify-center text-center px-6"
            >
              {filtersState === "loading" ? (
                <>
                  <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#fe2c55] animate-spin" />
                  <p className="mt-3 text-sm text-white/60">
                    Cargando los filtros de tu tienda...
                  </p>
                  <p className="mt-1 text-xs text-white/30">
                    Iniciar live se habilita en cuanto estén listos.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-white/60">
                    No pudimos cargar tus filtros.
                  </p>
                  <p className="mt-1 text-xs text-white/30">
                    {filtersError || "Revisa tu conexión e intenta de nuevo."}
                  </p>
                  <p className="mt-2 text-xs text-white/30">
                    Iniciar live queda bloqueado hasta que tus filtros estén cargados.
                  </p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="mt-4 h-9 px-4 rounded-xl text-xs font-semibold text-white transition-all duration-200"
                    style={{ backgroundColor: "#fe2c55" }}
                  >
                    Reintentar
                  </button>
                </>
              )}
            </div>
          )}
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
