/**
 * Captura del lead magnet del kit (`odd/tasks/kit-live-sin-improvisar.md`,
 * S5-S6). La regla vive acá y no en la UI para poderla probar sin navegador.
 * El destino es nuestro API: la tabla `leadMagnets` de Convex.
 */

/** Nuestro API (Vercel reescribe `/api/*` a Railway). */
export const LEAD_MAGNET_ENDPOINT = "/api/lead-magnets";

/** Las mismas opciones del formulario del demo (`kit-live-sin-improvisar`). */
export const CATEGORIES = [
  "Ropa",
  "Joyería y accesorios",
  "Tecnología",
  "Infoproductos",
  "Otro",
] as const;

export type LeadMagnetInput = {
  email: string;
  /** Opcional en el demo: quien no lo deja se queda sin `@`. */
  tiktok: string;
  category: string;
  /** Honeypot: una persona nunca lo llena. */
  website?: string;
};

export type LeadMagnetPayload = {
  email: string;
  tiktok: string;
  category: string;
  website: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIKTOK_RE = /^@?[A-Za-z0-9._]{2,24}$/;

/** `nick` y `@nick` salen siempre como `@nick`; vacío se queda vacío. */
export function normalizeTiktok(raw: string): string {
  const clean = raw.trim().replace(/^@+/, "");
  return clean ? `@${clean}` : "";
}

export function buildPayload(input: LeadMagnetInput): LeadMagnetPayload {
  return {
    email: input.email.trim(),
    tiktok: normalizeTiktok(input.tiktok),
    category: input.category,
    website: input.website ?? "",
  };
}

/**
 * `null` si se puede enviar; `"invalid"` si el correo no tiene forma válida, si
 * hay un `@` con forma inválida o si el rubro no es una de las opciones.
 */
export function validateLeadMagnet(input: LeadMagnetInput): "invalid" | null {
  const payload = buildPayload(input);
  const tiktokOk = payload.tiktok === "" || TIKTOK_RE.test(payload.tiktok);
  const valid =
    EMAIL_RE.test(payload.email) &&
    tiktokOk &&
    (CATEGORIES as readonly string[]).includes(payload.category);
  return valid ? null : "invalid";
}

/**
 * S6: JSON normal, sin `no-cors`, para que un 400 o un 429 se vean como error en
 * pantalla en vez de desbloquear el kit sin haber guardado nada.
 */
export async function submitLeadMagnet(
  payload: LeadMagnetPayload,
  doFetch: typeof fetch = fetch,
): Promise<void> {
  const response = await doFetch(LEAD_MAGNET_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`lead magnet ${response.status}`);
}
