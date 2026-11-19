"use client";

import { useState, useEffect, Fragment } from "react";
import { useAuth } from "@clerk/astro/react";
import { authHeaders } from "@/lib/api-auth";
import { fetchBillingState } from "@/lib/billing";
import { menuItems } from "@/lib/menu";
import { isActing } from "@/lib/acting";
import ActingAsBanner from "@/components/acting-as-banner";
import {
  readActiveStoreId,
  resolveActiveStore,
  useActiveStoreId,
  writeActiveStoreId,
} from "@/lib/active-store";

interface AppNavProps {
  current: "admin" | "admin.payments" | "admin.leads" | "admin.accounts" | "live" | "inbox" | "filters" | "billing" | "profile";

  stopButton?: React.ReactNode;

  pendingCount?: number;
}

const ICONS: Record<string, string> = {
  live: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  inbox: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155",
  filters: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75",
  billing: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
  admin: "M9 12.75L11.25 15 15 9.75M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.555-.337A5.97 5.97 0 015.41 20.97a5.97 5.97 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
  profile: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
};

export function AppNav({ current, stopButton, pendingCount }: AppNavProps) {
  const [open, setOpen] = useState(false);
  const { isSignedIn, isLoaded, getToken, signOut } = useAuth();
  const [expired, setExpired] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [acting, setActing] = useState(false);
  const [counts, setCounts] = useState<{ payments: number; leads: number; accounts: number } | null>(null);
  const [stores, setStores] = useState<Array<{ _id: string; tiktokUsername: string }>>([]);
  const activeStoreId = useActiveStoreId();

  useEffect(() => {
    setActing(isActing());
  }, []);

  useEffect(() => {
    if (!isAdmin || !isLoaded || !isSignedIn) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/counts", { headers: await authHeaders(getToken) });
        if (!res.ok) return;
        const data = (await res.json()) as { payments?: number; leads?: number; accounts?: number };
        if (!cancelled) {
          setCounts({
            payments: data.payments ?? 0,
            leads: data.leads ?? 0,
            accounts: data.accounts ?? 0,
          });
        }
      } catch {
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, isLoaded, isSignedIn]);

  const items = menuItems({ isAdmin, hasStore: stores.length > 0, acting, counts });

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    void fetchBillingState(getToken).then((state) => {
      if (!cancelled && state) {
        setExpired(state.access === "expired");
        setIsAdmin(state.role === "admin");
      }
    });

    void (async () => {
      try {
        const res = await fetch("/api/stores", { headers: await authHeaders(getToken) });
        if (!res.ok) return;
        const data = (await res.json()) as {
          stores?: Array<{ _id: string; tiktokUsername: string }>;
        };
        const list = data.stores ?? [];
        if (cancelled) return;
        setStores(list);

        if (list.length && !readActiveStoreId()) {
          const resolved = resolveActiveStore(list);
          if (resolved) writeActiveStoreId(resolved._id);
        }
      } catch {

      }
    })();
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
    admin: "Admin",
    "admin.payments": "Pagos pendientes",
    "admin.leads": "Leads",
    "admin.accounts": "Cuentas",
  };
  const title = labels[current] ?? "Live Leads";

  const isActive = (page: string) => current === page;

  return (
    <>
      {}
      <header
        className="sticky top-0 z-40 border-b border-white/[0.04]"
        style={{ backgroundColor: "#0b0f1a" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {}
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

      {}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {}
      <div
        className={`fixed top-14 left-0 bottom-0 z-40 w-64 p-4 transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: "#0b0f1a",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {stores.length > 0 && (
        <div className="px-3 pb-3">
          <span className="block text-[10px] uppercase tracking-wide text-white/25 mb-1">
            Tienda activa
          </span>
          <select
            value={activeStoreId ?? stores[0]?._id ?? ""}
            onChange={(e) => writeActiveStoreId(e.target.value)}
            className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/80 focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/40"
          >
            {stores.map((store) => (
              <option key={store._id} value={store._id} style={{ color: "#0b0f1a" }}>
                @{store.tiktokUsername}
              </option>
            ))}
          </select>
          <a
            href="/app/profile#tiendas"
            onClick={() => setOpen(false)}
            className="mt-2 inline-block text-[11px] text-white/40 hover:text-white/70"
          >
            Gestionar tiendas
          </a>
        </div>

        )}

        <ActingAsBanner />

        <nav className="space-y-1 pt-2">
          {items.map((item, index) => {
            const active = isActive(item.id);
            const separator = item.kind === "account" && index > 0;
            const accent = item.kind === "admin" ? "#facc15" : "#fe2c55";
            return (
              <Fragment key={item.id}>
              {separator ? <hr className="my-2 border-white/[0.06]" /> : null}
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-white/10 text-white"
                    : item.kind === "account"
                      ? "text-white/40 hover:text-white hover:bg-white/5"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <svg
                  className={`w-4 h-4 ${active ? "" : "text-current"}`}
                  style={active ? { color: accent } : undefined}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={ICONS[item.id.startsWith("admin.") ? "admin" : item.id] ?? ICONS.profile}
                  />
                </svg>
                {item.label}
                {item.count !== undefined ? (
                  <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                    style={
                      item.count > 0
                        ? { background: "rgba(254,44,85,0.18)", color: "#fe2c55" }
                        : { color: "rgba(255,255,255,0.32)" }
                    }
                  >
                    {item.count}
                  </span>
                ) : null}
                {item.id === "inbox" && pendingCount && item.count === undefined ? (
                  <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                    style={{ background: "rgba(254,44,85,0.18)", color: "#fe2c55" }}
                  >
                    {pendingCount}
                  </span>
                ) : null}
                {item.id === "billing" && expired ? (
                  <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(254,44,85,0.18)", color: "#fe2c55" }}
                  >
                    Vencido
                  </span>
                ) : null}
              </a>
              </Fragment>
            );
          })}

        </nav>

        {}
        {isSignedIn && (
          <div className="mt-1">
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
