const RESOLVE_PATH = "/api/tiktok/resolve";

export async function resolveLiveLink(
  raw: string,
  headers: Record<string, string>,
): Promise<string | null> {
  const value = raw.trim();
  if (!value) return null;

  try {
    const res = await fetch(RESOLVE_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ url: value }),
    });
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as { finalUrl?: unknown } | null;
    const finalUrl = data?.finalUrl;
    return typeof finalUrl === "string" ? finalUrl : null;
  } catch {
    return null;
  }
}
