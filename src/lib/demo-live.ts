const HANDLE = /^[A-Za-z0-9._]{1,24}$/;

export const DEMO_START_PATH = "/api/admin/lives/demo";
export const DEMO_STOP_PATH = "/api/admin/lives/demo/stop";

export type DemoStartResult =
  | { ok: true; sessionId: string }
  | { ok: false; status: number; message: string };

export type DemoStopResult = { ok: boolean; status: number; message: string };

function normalizeHandle(raw: string): string | null {
  const value = raw.trim().replace(/^@/, "").toLowerCase();
  return HANDLE.test(value) ? value : null;
}

export function parseDemoParam(search: string): string | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const value = new URLSearchParams(raw).get("demo");
  if (value === null) return null;
  return normalizeHandle(value);
}

export function demoLiveHref(username: string): string {
  const value = normalizeHandle(username);
  return value ? `/app?demo=${encodeURIComponent(value)}` : "/app";
}

function messageFrom(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const candidate = (data as { message?: unknown }).message;
  return typeof candidate === "string" ? candidate : "";
}

export async function startDemoLive(
  username: string,
  headers: Record<string, string>,
): Promise<DemoStartResult> {
  const handle = normalizeHandle(username);
  if (!handle) {
    return { ok: false, status: 0, message: "El usuario de TikTok no es válido" };
  }

  try {
    const res = await fetch(DEMO_START_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ username: handle }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: messageFrom(data) || `No se pudo iniciar el live demo (${res.status})`,
      };
    }

    const sessionId = (data as { live?: { sessionId?: unknown } } | null)?.live?.sessionId;
    if (typeof sessionId !== "string" || sessionId === "") {
      return {
        ok: false,
        status: res.status,
        message: `El API no devolvió la sesión del live demo (${res.status})`,
      };
    }

    return { ok: true, sessionId };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    return { ok: false, status: 0, message: `Fallo de red al iniciar el live demo: ${detail}` };
  }
}

export async function stopDemoLive(
  username: string,
  headers: Record<string, string>,
): Promise<DemoStopResult> {
  const handle = normalizeHandle(username);
  if (!handle) {
    return { ok: false, status: 0, message: "El usuario de TikTok no es válido" };
  }

  try {
    const res = await fetch(DEMO_STOP_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ username: handle }),
    });
    const data = await res.json().catch(() => null);

    if (res.status === 404) {
      return { ok: true, status: res.status, message: "" };
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: messageFrom(data) || `No se pudo detener el live demo (${res.status})`,
      };
    }
    return { ok: true, status: res.status, message: "" };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    return { ok: false, status: 0, message: `Fallo de red al detener el live demo: ${detail}` };
  }
}
