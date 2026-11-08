/**
 * Cobro por Yape (web): estado de acceso, precio y validación del código.
 * Las fechas del API son epoch en ms; `toMs` tolera ISO por si cambia el transporte.
 */

import { authHeaders, type GetToken } from "./api-auth.ts";

export type AccessStatus = "active" | "trial" | "expired";

/** Plan único: S/ 29.00. */
export const PRICE_CENTS = 2900;
/** Yape al que se paga y al que se manda la captura (sin `+`). */
export const YAPE_NUMBER = "51923873749";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export interface PendingPayment {
  _id?: string;
  amountCents: number;
  reference: string;
  status?: string;
  createdAt: number;
}

export interface BillingState {
  access: AccessStatus;
  trialEndsAt: number | null;
  paidUntil: number | null;
  priceCents: number;
  yapeNumber: string;
  pendingPayment: PendingPayment | null;
}

export interface AccessSummary {
  label: string;
  detail: string;
  /** Color del tema: ok, warning o marca. */
  tone: string;
}

function toMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

/** S1: `active` si `paidUntil > now`; `trial` si `trialEndsAt > now`; si no, `expired`. */
export function deriveAccess(
  dates: { paidUntil?: number | null; trialEndsAt?: number | null },
  now = Date.now(),
): AccessStatus {
  if (dates.paidUntil && dates.paidUntil > now) return "active";
  if (dates.trialEndsAt && dates.trialEndsAt > now) return "trial";
  return "expired";
}

/** "S/ 29" para 2900, "S/ 29.50" para 2950. */
export function formatSoles(cents: number): string {
  const soles = cents / 100;
  return `S/ ${Number.isInteger(soles) ? soles : soles.toFixed(2)}`;
}

/** "7 dic 2025"; cadena vacía si no hay fecha. */
export function formatDay(ts: number | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** `null` si el código sirve; si no, el mensaje que se muestra al usuario. */
export function validateReference(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Ingresa el código de operación";
  if (value.length < 6) return "El código tiene al menos 6 caracteres";
  if (value.length > 20) return "El código tiene como máximo 20 caracteres";
  return null;
}

/** Resume el estado de acceso en la etiqueta, el detalle y el color. */
export function accessSummary(state: BillingState): AccessSummary {
  if (state.access === "active") {
    return {
      label: "Activo",
      detail: `Activo hasta el ${formatDay(state.paidUntil)}`,
      tone: "#4ade80",
    };
  }
  if (state.access === "trial") {
    return {
      label: "Prueba gratis",
      detail: `Tu prueba termina el ${formatDay(state.trialEndsAt)}`,
      tone: "#facc15",
    };
  }
  return {
    label: "Vencido",
    detail: "Tu acceso venció. Registra tu pago para reactivarlo.",
    tone: "#fe2c55",
  };
}

/** Normaliza la respuesta de `GET /billing` y deriva el acceso si el API no lo manda. */
export function normalizeBilling(raw: unknown, now = Date.now()): BillingState {
  const data = (raw ?? {}) as Record<string, unknown>;
  const trialEndsAt = toMs(data.trialEndsAt);
  const paidUntil = toMs(data.paidUntil);
  const pending = data.pendingPayment as Record<string, unknown> | null | undefined;

  return {
    access:
      data.access === "active" || data.access === "trial" || data.access === "expired"
        ? data.access
        : deriveAccess({ paidUntil, trialEndsAt }, now),
    trialEndsAt,
    paidUntil,
    priceCents: typeof data.priceCents === "number" ? data.priceCents : PRICE_CENTS,
    yapeNumber: typeof data.yapeNumber === "string" && data.yapeNumber ? data.yapeNumber : YAPE_NUMBER,
    pendingPayment: pending
      ? {
          _id: typeof pending._id === "string" ? pending._id : undefined,
          amountCents: typeof pending.amountCents === "number" ? pending.amountCents : PRICE_CENTS,
          reference: typeof pending.reference === "string" ? pending.reference : "",
          status: typeof pending.status === "string" ? pending.status : undefined,
          createdAt: toMs(pending.createdAt) ?? 0,
        }
      : null,
  };
}

/** Estado de acceso del usuario; `null` si el API no responde (la UI no bloquea por eso). */
export async function fetchBillingState(
  getToken: GetToken,
  signal?: AbortSignal,
): Promise<BillingState | null> {
  try {
    const res = await fetch("/api/billing", { headers: await authHeaders(getToken), signal });
    if (!res.ok) return null;
    return normalizeBilling(await res.json());
  } catch {
    return null;
  }
}
