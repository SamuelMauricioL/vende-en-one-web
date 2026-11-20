const HANDLE = /^[A-Za-z0-9._]{1,24}$/;

function validHandle(handle: string): boolean {
  return HANDLE.test(handle);
}

export function parseTikTokProfileUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (value.startsWith("@")) {
    const handle = value.slice(1);
    return validHandle(handle) ? handle.toLowerCase() : null;
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (host !== "tiktok.com" && !host.endsWith(".tiktok.com")) return null;

  const match = url.pathname.match(/^\/@([^/]+)\/?$/);
  if (!match) return null;

  const handle = match[1];
  return validHandle(handle) ? handle.toLowerCase() : null;
}
