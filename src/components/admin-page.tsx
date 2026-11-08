"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import { authHeaders } from "@/lib/api-auth";
import { formatDay, formatSoles } from "@/lib/billing";

interface PendingPayment {
  _id: string;
  clerkUserId: string;
  amountCents: number;
  reference: string;
  status: string;
  createdAt: number;
}

/** Pagos pendientes: solo el rol admin puede aprobarlos o rechazarlos. */
export default function AdminPage() {
  const { userId, isLoaded, getToken } = useAuth();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payments?status=pending", {
        headers: await authHeaders(getToken),
      });
      if (res.status === 403) {
        setDenied(true);
        setPayments([]);
        return;
      }
      if (!res.ok) {
        toast.error(`No se pudieron cargar los pagos (${res.status})`);
        setPayments([]);
        return;
      }
      const data = (await res.json()) as PendingPayment[] | { payments?: PendingPayment[] };
      setPayments(Array.isArray(data) ? data : (data.payments ?? []));
    } catch {
      toast.error("Error de red al cargar los pagos");
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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      <AppNav current="admin" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pt-8 pb-12 space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-white/90 tracking-tight">Pagos pendientes</h2>
          <p className="text-sm text-white/40 mt-1">
            Aprueba solo cuando el Yape esté confirmado. Aprobar suma 30 días.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-white/40 text-center py-10">Cargando pagos…</p>
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
        ) : payments.length === 0 ? (
          <section
            className="rounded-3xl p-6 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm text-white/50">No hay pagos pendientes.</p>
          </section>
        ) : (
          <ul className="space-y-3">
            {payments.map((p) => (
              <li
                key={p._id}
                className="rounded-3xl p-5"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold text-white/90 tracking-tight">
                      {formatSoles(p.amountCents)}
                    </p>
                    <p className="mt-1 text-sm font-mono text-[#25f4ee] break-all">{p.reference}</p>
                    <p className="mt-1 text-[11px] text-white/35 break-all">{p.clerkUserId}</p>
                    <p className="text-[11px] text-white/25">
                      {formatDay(p.createdAt) || "—"}
                    </p>
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
      </main>

      <Toaster />
    </div>
  );
}
