/**
 * Lógica pura del reenganche al live (S7).
 *
 * El live vive en el servidor: al recargar la página el navegador pregunta por
 * `GET /lives/:username/status` y se engancha a la sesión que ya corre. Solo
 * cuando no hay sesión viva se arranca una nueva. Nada de acá toca red ni DOM,
 * así se puede probar con `npm test`.
 */

/** Clave existente en localStorage. Ahora guarda `{ username, sessionId }`. */
export const LIVE_RECONNECT_KEY = "lastLiveUsername";

/** Estados del servidor en los que la sesión sigue viva y sirve para engancharse. */
const RUNNING_STATUSES = new Set(["live", "connecting"]);

/** Intentos de reconexión del stream antes de rendirse. */
export const MAX_STREAM_RETRIES = 3;

/** `EventSource.CONNECTING`: el navegador va a reabrir por su cuenta. */
export const EVENT_SOURCE_CONNECTING = 0;
/** `EventSource.CLOSED`: el servidor rechazó la conexión. */
export const EVENT_SOURCE_CLOSED = 2;

export type SavedLive = { username: string; sessionId: string | null };

function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "");
}

/** Lee el handle guardado. Acepta el formato viejo, que era solo el @. */
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

/**
 * Qué hacer con la respuesta de `GET /lives/:username/status`.
 * `reconnect` reusa la sesión viva; `start` crea una nueva (solo si no hay
 * sesión y el monitor de la tienda confirma que el live existe); `forbidden`
 * es el 403 del @ que no es del perfil; `idle` deja la pantalla como está.
 */
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

/** 401/403/404: la sesión no existe o no es nuestra. Reintentar no la revive. */
export function isDeadSessionStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 404;
}

/**
 * ¿Se reabre el stream tras un corte? `ticketStatus` es el HTTP del pedido de
 * ticket (0 si la red falló) y `readyState` el del EventSource al fallar.
 */
export function shouldRetryStream(input: {
  ticketStatus: number;
  readyState: number;
  retries: number;
}): boolean {
  const { ticketStatus, readyState, retries } = input;
  if (isDeadSessionStatus(ticketStatus)) return false;
  if (readyState === EVENT_SOURCE_CLOSED) {
    // El servidor rechazó el stream: un reintento cubre un ticket caducado,
    // dos ya significan que el endpoint no va a responder.
    return retries === 0;
  }
  return retries < MAX_STREAM_RETRIES;
}
