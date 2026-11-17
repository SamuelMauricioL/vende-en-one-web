

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

export function normalizeTiktok(raw: string): string {
  return `@${raw.trim().replace(/^@+/, "")}`;
}

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
