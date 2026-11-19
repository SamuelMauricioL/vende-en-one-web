"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import ActingAsBanner from "@/components/acting-as-banner";
import { authHeaders } from "@/lib/api-auth";
import { writeActing } from "@/lib/acting";
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

interface ActingSubject {
  clerkUserId: string;
  handles: string[];
}

const card = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
};

export type AdminArea = "payments" | "leads" | "accounts";

export default function AdminPage({ area }: { area: AdminArea }) {
  const { userId, isLoaded, getToken } = useAuth();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [leadMagnets, setLeadMagnets] = useState<LeadMagnetEntry[]>([]);
  const [subjects, setSubjects] = useState<ActingSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const headers = await authHeaders(getToken);

      const [paymentsRes, waitlistRes, leadMagnetsRes, usersRes] = await Promise.all([
        fetch("/api/admin/payments?status=pending", { headers }),
        fetch("/api/admin/waitlist", { headers }),
        fetch("/api/admin/lead-magnets", { headers }),
        fetch("/api/admin/users", { headers }),
      ]);

      if ([paymentsRes, waitlistRes, leadMagnetsRes, usersRes].some((res) => res.status === 403)) {
        setDenied(true);
        setPayments([]);
        setWaitlist([]);
        setLeadMagnets([]);
        setSubjects([]);
        return;
      }

      if (usersRes.ok) {
        const data = (await usersRes.json()) as { users?: ActingSubject[] };
        setSubjects(data.users ?? []);
      } else {
        toast.error(`No se pudieron cargar las cuentas (${usersRes.status})`);
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

  const actAs = useCallback(
    async (clerkUserId: string, fallbackHandle: string) => {
      setActingId(clerkUserId);
      try {
        const res = await fetch("/api/admin/act-as", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await authHeaders(getToken)) },
          body: JSON.stringify({ clerkUserId }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          token?: string;
          expiresAt?: number;
          subject?: { handles?: string[] };
          message?: string;
        };

        if (res.status === 403) {
          setDenied(true);
          setPayments([]);
          setWaitlist([]);
          setLeadMagnets([]);
          setSubjects([]);
          return;
        }
        if (!res.ok) {
          toast.error(data.message || `No se pudo actuar como esa cuenta (${res.status})`);
          return;
        }
        if (typeof data.token !== "string" || typeof data.expiresAt !== "number") {
          toast.error("El API no devolvió un token de actuación válido");
          return;
        }

        const handle = data.subject?.handles?.[0] || fallbackHandle;
        writeActing({ token: data.token, expiresAt: data.expiresAt, handle });
        window.location.href = "/app";
      } catch {
        toast.error("Error de red al actuar como esa cuenta");
      } finally {
        setActingId(null);
      }
    },
    [getToken],
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      <AppNav current="admin" />
      <ActingAsBanner />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pt-8 pb-12 space-y-4">
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
        ) : area === "payments" ? (
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
        ) : area === "leads" ? (
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
        ) : (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-white/90 tracking-tight">Cuentas</h2>
              <p className="text-sm text-white/40 mt-1">
                Entra como un cliente para ver su panel y operar sobre sus datos. Sales con
                el botón del banner.
              </p>
            </div>

            {subjects.length === 0 ? (
              <section className="rounded-3xl p-6 text-center" style={card}>
                <p className="text-sm text-white/50">Todavía no hay cuentas de clientes.</p>
              </section>
            ) : (
              <ul className="space-y-3">
                {subjects.map((subject) => {
                  const handle = subject.handles[0] || subject.clerkUserId;
                  return (
                    <li key={subject.clerkUserId} className="rounded-3xl p-5" style={card}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-mono text-[#25f4ee] break-all">@{handle}</p>
                          <p className="mt-1 text-[11px] text-white/35 break-all">
                            {subject.handles.length > 1
                              ? subject.handles.map((item) => `@${item}`).join(" · ")
                              : subject.clerkUserId}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={actingId === subject.clerkUserId}
                          onClick={() => void actAs(subject.clerkUserId, handle)}
                          className="h-9 px-3 shrink-0 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-40"
                          style={{ background: "rgba(37,244,238,0.12)", color: "#25f4ee" }}
                        >
                          Actuar como
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </main>

      <Toaster />
    </div>
  );
}
