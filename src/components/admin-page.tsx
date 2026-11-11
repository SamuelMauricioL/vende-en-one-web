"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import { authHeaders } from "@/lib/api-auth";
import { formatDay, formatSoles } from "@/lib/billing";

interface WaitlistEntry {
  _id: string;
  email: string;
  store: string;
  tiktok: string;
  category: string;
  frequency: string;
  createdAt: number;
}

interface LeadMagnetEntry {
  _id: string;
  email: string;
  tiktok: string;
  category: string;
  createdAt: number;
}

interface PendingPayment {
  _id: string;
  clerkUserId: string;
  amountCents: number;
  reference: string;
  status: string;
  createdAt: number;
}

const card = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
};

/**
 * S15 de `odd/tasks/kit-live-sin-improvisar.md`: el panel pasa a dos tabs.
 * «Pagos pendientes» es lo que ya existía, sin cambios de comportamiento;
 * «Leads» junta las dos capturas: la waitlist de `/waitlist` y los registros del
 * kit de `/kit`.
 */
export default function AdminPage() {
  const { userId, isLoaded, getToken } = useAuth();
  const [tab, setTab] = useState<"payments" | "leads">("payments");
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [leadMagnets, setLeadMagnets] = useState<LeadMagnetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const headers = await authHeaders(getToken);

      const [paymentsRes, waitlistRes, leadMagnetsRes] = await Promise.all([
        fetch("/api/admin/payments?status=pending", { headers }),
        fetch("/api/admin/waitlist", { headers }),
        fetch("/api/admin/lead-magnets", { headers }),
      ]);

      if ([paymentsRes, waitlistRes, leadMagnetsRes].some((res) => res.status === 403)) {
        setDenied(true);
        setPayments([]);
        setWaitlist([]);
        setLeadMagnets([]);
        return;
      }

      if (paymentsRes.ok) {
        const data = (await paymentsRes.json()) as PendingPayment[] | { payments?: PendingPayment[] };
        setPayments(Array.isArray(data) ? data : (data.payments ?? []));
      } else {
        toast.error(`No se pudieron cargar los pagos (${paymentsRes.status})`);
      }

      if (waitlistRes.ok) {
        const data = (await waitlistRes.json()) as { entries?: WaitlistEntry[] };
        setWaitlist(data.entries ?? []);
      }

      if (leadMagnetsRes.ok) {
        const data = (await leadMagnetsRes.json()) as { entries?: LeadMagnetEntry[] };
        setLeadMagnets(data.entries ?? []);
      }
    } catch {
      toast.error("Error de red al cargar el panel");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void load();
  }, [isLoaded, userId, load]);

  const resolve = useCallback(
    async (id: string, action: "approve" | "reject") => {
      setBusyId(id);
      try {
        const res = await fetch(`/api/admin/payments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...(await authHeaders(getToken)) },
          body: JSON.stringify({ action }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.status === 403) {
          setDenied(true);
          setPayments([]);
          return;
        }
        if (!res.ok) {
          toast.error(data.message || `No se pudo resolver el pago (${res.status})`);
          return;
        }

        toast.success(action === "approve" ? "Pago aprobado: +30 días" : "Pago rechazado");
        setPayments((prev) => prev.filter((p) => p._id !== id));
      } catch {
        toast.error("Error de red al resolver el pago");
      } finally {
        setBusyId(null);
      }
    },
    [getToken],
  );

  const tabs = [
    { id: "payments" as const, label: "Pagos pendientes", count: payments.length },
    { id: "leads" as const, label: "Leads", count: waitlist.length + leadMagnets.length },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      <AppNav current="admin" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pt-8 pb-12 space-y-4">
        <div
          role="tablist"
          aria-label="Secciones del panel"
          className="flex gap-1 p-1 rounded-2xl"
          style={card}
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all duration-200 ${
                tab === item.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {item.label}
              <span className="ml-1.5 text-white/30 tabular-nums">{item.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-white/40 text-center py-10">Cargando…</p>
        ) : denied ? (
          <section
            className="rounded-3xl p-6 text-center"
            style={{ background: "rgba(254,44,85,0.06)", border: "1px solid rgba(254,44,85,0.18)" }}
          >
            <p className="text-sm font-bold" style={{ color: "#fe2c55" }}>
              No tienes acceso
            </p>
            <p className="text-xs text-white/35 mt-1">Esta sección es solo para administradores.</p>
          </section>
        ) : tab === "payments" ? (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-white/90 tracking-tight">Pagos pendientes</h2>
              <p className="text-sm text-white/40 mt-1">
                Aprueba solo cuando el Yape esté confirmado. Aprobar suma 30 días.
              </p>
            </div>

            {payments.length === 0 ? (
              <section className="rounded-3xl p-6 text-center" style={card}>
                <p className="text-sm text-white/50">No hay pagos pendientes.</p>
              </section>
            ) : (
              <ul className="space-y-3">
                {payments.map((p) => (
                  <li key={p._id} className="rounded-3xl p-5" style={card}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold text-white/90 tracking-tight">
                          {formatSoles(p.amountCents)}
                        </p>
                        <p className="mt-1 text-sm font-mono text-[#25f4ee] break-all">{p.reference}</p>
                        <p className="mt-1 text-[11px] text-white/35 break-all">{p.clerkUserId}</p>
                        <p className="text-[11px] text-white/25">{formatDay(p.createdAt) || "—"}</p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={busyId === p._id}
                          onClick={() => void resolve(p._id, "approve")}
                          className="h-9 px-3 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-40"
                          style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          disabled={busyId === p._id}
                          onClick={() => void resolve(p._id, "reject")}
                          className="h-9 px-3 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-40"
                          style={{ background: "rgba(254,44,85,0.15)", color: "#fe2c55" }}
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-white/90 tracking-tight">Leads</h2>
              <p className="text-sm text-white/40 mt-1">
                Quiénes dejaron su correo, el más nuevo primero.
              </p>
            </div>

            <section>
              <h3 className="text-sm font-bold text-white/70">
                Waitlist <span className="text-white/30 tabular-nums">{waitlist.length}</span>
              </h3>
              <p className="text-xs text-white/35 mt-1">Registros de /waitlist.</p>
              {waitlist.length === 0 ? (
                <p className="mt-3 text-sm text-white/40">Todavía no hay registros.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {waitlist.map((entry) => (
                    <li key={entry._id} className="rounded-3xl p-5" style={card}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white/90 break-all">{entry.email}</p>
                          <p className="mt-1 text-sm text-white/60">{entry.store}</p>
                          <p className="mt-1 text-sm font-mono text-[#25f4ee] break-all">{entry.tiktok}</p>
                          <p className="mt-1 text-[11px] text-white/35">
                            {entry.category} · {entry.frequency}
                          </p>
                        </div>
                        <p className="text-[11px] text-white/25 shrink-0">
                          {formatDay(entry.createdAt) || "—"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-sm font-bold text-white/70">
                Lead magnets <span className="text-white/30 tabular-nums">{leadMagnets.length}</span>
              </h3>
              <p className="text-xs text-white/35 mt-1">Registros del kit de /kit.</p>
              {leadMagnets.length === 0 ? (
                <p className="mt-3 text-sm text-white/40">Todavía no hay registros.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {leadMagnets.map((entry) => (
                    <li key={entry._id} className="rounded-3xl p-5" style={card}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white/90 break-all">{entry.email}</p>
                          <p className="mt-1 text-sm font-mono text-[#25f4ee] break-all">
                            {entry.tiktok || "—"}
                          </p>
                          <p className="mt-1 text-[11px] text-white/35">{entry.category}</p>
                        </div>
                        <p className="text-[11px] text-white/25 shrink-0">
                          {formatDay(entry.createdAt) || "—"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <Toaster />
    </div>
  );
}
