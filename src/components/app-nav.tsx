"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/astro/react";
import { fetchBillingState } from "@/lib/billing";

interface AppNavProps {
  current: "live" | "inbox" | "filters" | "profile" | "billing" | "admin";
  /** Optional stop button for live page (mobile) */
  stopButton?: React.ReactNode;
  /** Conversaciones sin desenlace: badge de la bandeja de rescate */
  pendingCount?: number;
}

export function AppNav({ current, stopButton, pendingCount }: AppNavProps) {
  const [open, setOpen] = useState(false);
  const { isSignedIn, isLoaded, getToken, signOut } = useAuth();
  const [expired, setExpired] = useState(false);

  // Aviso de vencimiento: solo consulta, nunca bloquea otras pantallas.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    void fetchBillingState(getToken).then((state) => {
      if (!cancelled && state) setExpired(state.access === "expired");
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  const labels: Record<string, string> = {
    live: "Live Controller",
    inbox: "Bandeja de rescate",
    filters: "Filtros personalizados",
    profile: "Perfil",
    billing: "Cobro y acceso",
    admin: "Pagos pendientes",
  };
  const title = labels[current] ?? "Live Leads";

  const isActive = (page: string) => current === page;

  return (
    <>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-white/[0.04]"
        style={{ backgroundColor: "#0b0f1a" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setOpen((p) => !p)}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 hover:bg-white/5 active:scale-95"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              aria-label="Menú"
            >
              {open ? (
                <svg
                  className="w-3.5 h-3.5 text-white/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 text-white/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>

            <h1 className="text-lg font-extrabold text-white/90 tracking-tight">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {expired && (
              <a
                href="/app/billing"
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 hover:bg-white/5"
                style={{ background: "rgba(254,44,85,0.12)", color: "#fe2c55" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#fe2c55] animate-pulse" />
                Acceso vencido
              </a>
            )}
            {stopButton}
          </div>
        </div>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-14 left-0 bottom-0 z-40 w-64 p-4 transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: "#0b0f1a",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <nav className="space-y-1 pt-2">
          <a
            href="/app"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive("live")
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            {/* Live icon */}
            <svg
              className={`w-4 h-4 ${isActive("live") ? "text-[#fe2c55]" : "text-current"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            Live
          </a>

          <a
            href="/app/inbox"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive("inbox")
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            {/* Inbox icon */}
            <svg
              className={`w-4 h-4 ${isActive("inbox") ? "text-[#fe2c55]" : "text-current"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
            Bandeja
            {pendingCount ? (
              <span
                className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                style={{ background: "rgba(254,44,85,0.18)", color: "#fe2c55" }}
              >
                {pendingCount}
              </span>
            ) : null}
          </a>


          <a
            href="/app/filters"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive("filters")
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            {/* Filter icon */}
            <svg
              className={`w-4 h-4 ${isActive("filters") ? "text-[#facc15]" : "text-current"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
            Filtros
          </a>

          <a
            href="/app/billing"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive("billing")
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            {/* Billing icon */}
            <svg
              className={`w-4 h-4 ${isActive("billing") ? "text-[#25f4ee]" : "text-current"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
              />
            </svg>
            Cobro
            {expired ? (
              <span
                className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: "rgba(254,44,85,0.18)", color: "#fe2c55" }}
              >
                Vencido
              </span>
            ) : null}
          </a>

          <a
            href="/app/profile"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive("profile")
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            {/* Profile icon */}
            <svg
              className={`w-4 h-4 ${isActive("profile") ? "text-[#fe2c55]" : "text-current"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            Perfil
          </a>
        </nav>

        {/* Sign out at bottom */}
        {isSignedIn && (
          <div className="absolute bottom-4 left-4 right-4">
            <button
              type="button"
              onClick={() => signOut()}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </>
  );
}
