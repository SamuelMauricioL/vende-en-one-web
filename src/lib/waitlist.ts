/**
 * Waitlist pública (`odd/tasks/waitlist.md`, S2-S4). La regla vive acá y no en la
 * UI para que se pruebe sin navegador. El destino es el Apps Script del demo, que
 * escribe en su Google Sheet: este repo no guarda los registros.
 */

export const WAITLIST_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyZX6ws3xqGAxhLZWXLXCdqkp8dyi4rm5-LU-KiKkvh06YlNJaTwllTvhmkiKuN4MIH/exec";

export const CATEGORIES = [
  "Ropa y calzado",
  "Joyería y accesorios",
  "Tecnología",
  "Belleza y cuidado personal",
  "Hogar y juguetes",
  "Infoproductos y cursos",
  "Otra",
] as const;

export const FREQUENCIES = ["1 o 2", "3 a 5", "6 o más", "Aún no hago lives"] as const;

export type WaitlistInput = {
  email: string;
  store: string;
  tiktok: string;
  category: string;
  frequency: string;
  /** Honeypot: una persona nunca lo llena. */
  website?: string;
};

export type WaitlistPayload = {
  email: string;
  store: string;
  tiktok: string;
  category: string;
  frequency: string;
  website: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIKTOK_RE = /^@?[A-Za-z0-9._]{2,24}$/;

/** `nick` y `@nick` salen siempre como `@nick`. */
export function normalizeTiktok(raw: string): string {
  return `@${raw.trim().replace(/^@+/, "")}`;
}

/** Arma el body tal cual lo espera el Apps Script. */
export function buildPayload(input: WaitlistInput): WaitlistPayload {
  return {
    email: input.email.trim(),
    store: input.store.trim(),
    tiktok: normalizeTiktok(input.tiktok),
    category: input.category,
    frequency: input.frequency,
    website: input.website ?? "",
  };
}

/**
 * `null` si se puede enviar; `"invalid"` si falta algo o el correo/@ no tienen
 * forma válida. Un solo código porque el demo muestra un único mensaje (S4).
 */
export function validateWaitlist(input: WaitlistInput): "invalid" | null {
  const payload = buildPayload(input);
  const valid =
    EMAIL_RE.test(payload.email) &&
    payload.store.length > 0 &&
    TIKTOK_RE.test(payload.tiktok) &&
    (CATEGORIES as readonly string[]).includes(payload.category) &&
    (FREQUENCIES as readonly string[]).includes(payload.frequency);
  return valid ? null : "invalid";
}

/**
 * S3: `no-cors` porque el Apps Script no responde cabeceras CORS; la respuesta es
 * opaca, así que el éxito se asume al no haber error de red.
 */
export async function submitWaitlist(
  payload: WaitlistPayload,
  endpoint: string = WAITLIST_ENDPOINT,
): Promise<void> {
  await fetch(endpoint, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
}
