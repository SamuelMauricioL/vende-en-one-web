export const ACTING_STORAGE_KEY = "ll_acting_as";
export const ACTING_EVENT = "ll-acting-as";
export const ACTING_COOKIE = "ll_acting";
export const ACTING_COOKIE_VALUE = "1";

export type ActingState = {
  token: string;
  expiresAt: number;
  handle: string;
};

function store(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function notify(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ACTING_EVENT));
}

function actingCookie(maxAgeSeconds: number): string {
  const age = Math.max(0, maxAgeSeconds);
  const value = age > 0 ? ACTING_COOKIE_VALUE : "";
  return `${ACTING_COOKIE}=${value}; Path=/; Max-Age=${age}; SameSite=Lax`;
}

function setActingCookie(maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = actingCookie(maxAgeSeconds);
  } catch {}
}

function parse(raw: string): ActingState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { token, expiresAt, handle } = parsed as Record<string, unknown>;
    if (typeof token !== "string" || token.length === 0) return null;
    if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) return null;
    if (typeof handle !== "string") return null;
    return { token, expiresAt, handle };
  } catch {
    return null;
  }
}

export function readActing(now: number = Date.now()): ActingState | null {
  const storage = store();
  if (!storage) return null;

  let raw: string | null = null;
  try {
    raw = storage.getItem(ACTING_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  const state = parse(raw);
  if (!state) {
    clearActing();
    return null;
  }
  if (state.expiresAt <= now) {
    clearActing();
    return null;
  }
  return state;
}

export function writeActing(state: ActingState): void {
  const storage = store();
  try {
    storage?.setItem(ACTING_STORAGE_KEY, JSON.stringify(state));
  } catch {}
  const remainingMs = state.expiresAt - Date.now();
  setActingCookie(remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0);
  notify();
}

export function clearActing(): void {
  const storage = store();
  try {
    storage?.removeItem(ACTING_STORAGE_KEY);
  } catch {}
  setActingCookie(0);
  notify();
}

export function isActing(now: number = Date.now()): boolean {
  return readActing(now) !== null;
}

export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
