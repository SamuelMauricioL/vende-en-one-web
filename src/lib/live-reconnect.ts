

export const LIVE_RECONNECT_KEY = "lastLiveUsername";

const RUNNING_STATUSES = new Set(["live", "connecting"]);

export const MAX_STREAM_RETRIES = 3;

export const EVENT_SOURCE_CONNECTING = 0;

export const EVENT_SOURCE_CLOSED = 2;

export type SavedLive = { username: string; sessionId: string | null };

function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "");
}

export function parseSavedLive(raw: string | null): SavedLive | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string") {
      const username = normalizeUsername(parsed);
      return username ? { username, sessionId: null } : null;
    }
    if (parsed && typeof parsed === "object") {
      const { username, sessionId } = parsed as { username?: unknown; sessionId?: unknown };
      if (typeof username !== "string" || !normalizeUsername(username)) return null;
      return {
        username: normalizeUsername(username),
        sessionId: typeof sessionId === "string" && sessionId ? sessionId : null,
      };
    }
    return null;
  } catch {
    const username = normalizeUsername(raw);
    return username ? { username, sessionId: null } : null;
  }
}

export function formatSavedLive(live: SavedLive): string {
  return JSON.stringify({ username: live.username, sessionId: live.sessionId });
}

export type ReconnectDecision =
  | { kind: "reconnect"; sessionId: string }
  | { kind: "start" }
  | { kind: "idle" }
  | { kind: "forbidden"; message: string };

export function decideLiveReconnect(input: {
  httpStatus: number;
  body: unknown;
  monitorSaysLive?: boolean;
}): ReconnectDecision {
  const { httpStatus, body, monitorSaysLive = false } = input;

  if (httpStatus === 403) {
    const message =
      body && typeof body === "object" && typeof (body as { message?: unknown }).message === "string"
        ? ((body as { message: string }).message)
        : "Ese @ no pertenece a tu cuenta";
    return { kind: "forbidden", message };
  }

  if (httpStatus === 200) {
    const live = (body as { live?: { status?: unknown; sessionId?: unknown } } | null)?.live;
    const status = typeof live?.status === "string" ? live.status : "";
    const sessionId = typeof live?.sessionId === "string" ? live.sessionId : "";
    if (RUNNING_STATUSES.has(status) && sessionId) {
      return { kind: "reconnect", sessionId };
    }
    return monitorSaysLive ? { kind: "start" } : { kind: "idle" };
  }

  return monitorSaysLive ? { kind: "start" } : { kind: "idle" };
}

export function isDeadSessionStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 404;
}

export function shouldRetryStream(input: {
  ticketStatus: number;
  readyState: number;
  retries: number;
}): boolean {
  const { ticketStatus, readyState, retries } = input;
  if (isDeadSessionStatus(ticketStatus)) return false;
  if (readyState === EVENT_SOURCE_CLOSED) {

    return retries === 0;
  }
  return retries < MAX_STREAM_RETRIES;
}
