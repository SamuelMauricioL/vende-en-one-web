/**
 * Waitlist pública (`odd/tasks/waitlist.md`, S2-S4). La regla vive acá y no en la
 * UI para que se pruebe sin navegador. El destino es el Apps Script del demo, que
 * escribe en su Google Sheet: este repo no guarda los registros.
 */

/** Nuestro API (Vercel reescribe `/api/*` a Railway). Antes era un Apps Script. */
export const WAITLIST_ENDPOINT = "/api/waitlist";

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
 * S3: JSON normal contra nuestro API, sin `no-cors`, para que un 400 o un 429 se
 * vean como error en pantalla en vez de un éxito falso (eso pasaba con el Apps
 * Script, que no permitía leer la respuesta).
 */
export async function submitWaitlist(
  payload: WaitlistPayload,
  doFetch: typeof fetch = fetch,
): Promise<void> {
  const response = await doFetch(WAITLIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`waitlist ${response.status}`);
}
