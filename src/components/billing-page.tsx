"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import { authHeaders } from "@/lib/api-auth";
import {
  PRICE_CENTS,
  YAPE_NUMBER,
  accessSummary,
  fetchBillingState,
  formatDay,
  formatSoles,
  validateReference,
  type BillingState,
} from "@/lib/billing";

/** Cobro por Yape: estado de acceso, datos de pago, los 3 pasos y el registro del código. */
export default function BillingPage() {
  const { userId, isLoaded, getToken } = useAuth();
  const [state, setState] = useState<BillingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [reference, setReference] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchBillingState(getToken);
    setState(data);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void load();
  }, [isLoaded, userId, load]);

  const price = state?.priceCents ?? PRICE_CENTS;
  const yape = state?.yapeNumber ?? YAPE_NUMBER;
  const summary = state ? accessSummary(state) : null;

  const copyNumber = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`+${yape}`);
      toast.success("Número copiado");
    } catch {
      toast.error(`Copia el número a mano: +${yape}`);
    }
  }, [yape]);

  const submit = useCallback(async () => {
    const error = validateReference(reference);
    if (error) {
      toast.error(error);
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders(getToken)) },
        body: JSON.stringify({ reference: reference.trim(), amountCents: price }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setReference("");
        toast.success("Pago registrado. Un administrador lo revisará.");
        await load();
      } else if (res.status === 409) {
        toast.error("Ya tienes un pago pendiente de revisión");
        await load();
      } else {
        toast.error(data.message || `No se pudo registrar el pago (${res.status})`);
      }
    } catch {
      toast.error("Error de red al registrar el pago");
    } finally {
      setSending(false);
    }
  }, [reference, price, getToken, load]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      <AppNav current="billing" />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 pt-8 pb-12 space-y-4">
        {loading ? (
          <p className="text-sm text-white/40 text-center py-10">Cargando tu estado…</p>
        ) : (
          <>
            {/* Estado de acceso */}
            <section
              className="rounded-3xl p-6"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {summary ? (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg"
                    style={{ background: `${summary.tone}1f`, color: summary.tone }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: summary.tone }} />
                    {summary.label}
                  </span>
                  <p className="mt-3 text-sm text-white/60 leading-relaxed">{summary.detail}</p>
                  {state?.access === "active" && state.trialEndsAt ? (
                    <p className="mt-1 text-[11px] text-white/25">
                      Tu prueba terminó el {formatDay(state.trialEndsAt)}
                    </p>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-extrabold text-white/90 tracking-tight">{formatSoles(price)}</p>
                  <p className="text-[11px] text-white/30">por 30 días</p>
                </div>
              </div>
              ) : (
                <p className="text-sm text-white/40">No pudimos leer tu estado de acceso.</p>
              )}
            </section>

            {/* Número de Yape */}
            <section
              className="rounded-3xl p-6"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-xs font-medium text-white/40">Yapea al número</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-lg font-extrabold text-white/90 font-mono tracking-tight">+{yape}</p>
                <button
                  type="button"
                  onClick={copyNumber}
                  className="h-9 px-3 rounded-xl text-xs font-semibold transition-all duration-200 hover:bg-white/5 active:scale-95"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#25f4ee" }}
                >
                  Copiar
                </button>
              </div>

              {/* Los 3 pasos */}
              <ol className="mt-5 space-y-3">
                {[
                  `Yapea ${formatSoles(price)} al +${yape}`,
                  "Manda la captura a ese mismo WhatsApp",
                  "Registra aquí el código de operación",
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span
                      className="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-bold"
                      style={{ background: "rgba(254,44,85,0.15)", color: "#fe2c55" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-white/60 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              <a
                href={`https://wa.me/${yape}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#25f4ee] hover:underline"
              >
                Abrir WhatsApp +{yape}
              </a>
            </section>

            {/* Pago pendiente o formulario */}
            {state?.pendingPayment ? (
              <section
                className="rounded-3xl p-6"
                style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.18)" }}
              >
                <p className="text-sm font-bold" style={{ color: "#facc15" }}>
                  Pago pendiente de revisión
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/35">Monto</dt>
                    <dd className="text-white/80 font-mono">{formatSoles(state.pendingPayment.amountCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/35">Código</dt>
                    <dd className="text-white/80 font-mono break-all text-right">
                      {state.pendingPayment.reference}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/35">Registrado</dt>
                    <dd className="text-white/80">{formatDay(state.pendingPayment.createdAt) || "—"}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-[11px] text-white/30 leading-relaxed">
                  Apenas lo aprobemos se suman 30 días a tu acceso.
                </p>
              </section>
            ) : (
              <section
                className="rounded-3xl p-6"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <label htmlFor="reference" className="block text-xs font-medium text-white/40 mb-1.5">
                  Código de operación
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                  }}
                  className="space-y-3"
                >
                  <input
                    id="reference"
                    type="text"
                    inputMode="text"
                    placeholder="Ej. 0123456"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    maxLength={20}
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full h-12 px-3 rounded-xl text-sm bg-white/5 text-white/90 placeholder:text-white/25 outline-none focus:ring-2 focus:ring-[#fe2c55]/40 font-mono"
                    style={{ border: "1px solid rgba(255,255,255,0.10)" }}
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-[0.99] disabled:opacity-40"
                    style={{ background: "#fe2c55" }}
                  >
                    {sending ? "Enviando…" : "Registrar pago"}
                  </button>
                </form>
                <p className="mt-3 text-[11px] text-white/25 leading-relaxed">
                  La captura no se sube a la app: solo guardamos el código y el monto.
                </p>
              </section>
            )}
          </>
        )}
      </main>

      <Toaster />
    </div>
  );
}
