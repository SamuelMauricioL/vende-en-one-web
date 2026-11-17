

export const LEAD_MAGNET_ENDPOINT = "/api/lead-magnets";

export const CATEGORIES = [
  "Ropa",
  "Joyería y accesorios",
  "Tecnología",
  "Infoproductos",
  "Otro",
] as const;

export type LeadMagnetInput = {
  email: string;

  tiktok: string;
  category: string;

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

export function validateLeadMagnet(input: LeadMagnetInput): "invalid" | null {
  const payload = buildPayload(input);
  const tiktokOk = payload.tiktok === "" || TIKTOK_RE.test(payload.tiktok);
  const valid =
    EMAIL_RE.test(payload.email) &&
    tiktokOk &&
    (CATEGORIES as readonly string[]).includes(payload.category);
  return valid ? null : "invalid";
}

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
