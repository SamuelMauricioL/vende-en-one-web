/**
 * Bloque "EN VIVO" de la bandeja (S9/S10).
 *
 * Puro: recibe lo que dice el stream por tienda y devuelve qué dibujar. Nada de
 * red ni DOM, así se puede probar con `npm test`. La bandeja no filtra nada: el
 * servidor ya entregó el mismo conjunto filtrado que ve el vendedor.
 */
import { leadMessage, leadOutcome, type LeadRow, type Totals } from "./filters-api.ts";
import type { Conversation } from "./inbox-api.ts";

/** Fases que emite `GET /stores/:storeId/live/stream`. `null` = aún sin frame. */
export type LivePhase = "idle" | "live" | "ended";

/**
 * Frames reales del stream por tienda (S8). La fase viaja en `state` dentro del
 * frame `status`, no en el `type`; el stream se queda abierto entre sesiones.
 */
export type StoreFrame =
  | {
      type: "status";
      state: LivePhase;
      sessionId: string | null;
      username: string | null;
      /** La API avisa el corte por acá cuando sabe por qué terminó. */
      error?: string;
    }
  | { type: "stats"; stats: LeadRow[]; totals: Totals }
  | { type: "chat"; chat: readonly unknown[] }
  | { type: "outcome"; lead: LeadRow };

/** Lo que el stream sabe del live de la tienda. `null` = todavía nada. */
export interface LiveStreamState {
  phase: LivePhase | null;
  sessionId: string | null;
  username: string | null;
  /** Foto completa de `stats`: el servidor ya entregó el conjunto filtrado. */
  rows: LeadRow[] | null;
  totals: Totals | null;
  error: string | null;
}

export const EMPTY_LIVE_STREAM: LiveStreamState = {
  phase: null,
  sessionId: null,
  username: null,
  rows: null,
  totals: null,
  error: null,
};

function isPhase(value: unknown): value is LivePhase {
  return value === "idle" || value === "live" || value === "ended";
}

/**
 * Aplica un frame del stream por tienda y devuelve el estado siguiente.
 * `stats` es la foto completa; `outcome` corrige (o agrega) una sola persona.
 */
export function applyStoreFrame(
  state: LiveStreamState,
  frame: StoreFrame,
): LiveStreamState {
  switch (frame.type) {
    case "status": {
      const phase = isPhase(frame.state) ? frame.state : state.phase;
      return {
        ...state,
        phase,
        sessionId: frame.sessionId ?? null,
        username: frame.username ?? null,
        error: frame.error ?? null,
        // Al cerrarse la sesión su foto deja de valer: la próxima manda la suya.
        rows: phase === "live" ? state.rows : null,
      };
    }
    case "stats":
      // Lista completa y ordenada por el servidor: se reemplaza tal cual.
      return { ...state, rows: frame.stats, totals: frame.totals };
    case "outcome": {
      const rows = state.rows ?? [];
      const known = rows.some((row) => row.tiktokUserId === frame.lead.tiktokUserId);
      return {
        ...state,
        rows: known
          ? rows.map((row) =>
              row.tiktokUserId === frame.lead.tiktokUserId ? frame.lead : row,
            )
          : [...rows, frame.lead],
      };
    }
    default:
      // `chat` no se usa en la bandeja: el hilo se lee aparte.
      return state;
  }
}

export interface LiveBand {
  /** Solo existe mientras hay live: `idle` y `ended` la dejan invisible. */
  visible: boolean;
  phase: "hidden" | "connecting" | "live" | "offline";
  tone: "live" | "pending" | "warning";
  /** Texto principal del bloque (sin el contador). */
  label: string;
  /** Contador; es lo único que se anuncia con `aria-live`. */
  countLabel: string;
  count: number;
}

const HIDDEN: LiveBand = {
  visible: false,
  phase: "hidden",
  tone: "pending",
  label: "",
  countLabel: "",
  count: 0,
};

function at(handle: string): string {
  const clean = handle.trim().replace(/^@/, "");
  return clean ? `@${clean}` : "";
}

/**
 * Estado del bloque pinneado.
 * Sin frame todavía se dice "conectando": el live pudo empezar y todavía no lo
 * sabemos. Un corte con live en curso se avisa en ámbar (S9).
 */
export function liveBand(input: {
  phase: LivePhase | null;
  connected: boolean;
  totals: Pick<Totals, "qualified"> | null;
  storeLabel: string;
  error?: string | null;
}): LiveBand {
  const { phase, connected, totals } = input;
  const error = input.error ?? null;
  if (phase === "idle" || phase === "ended") return HIDDEN;

  const offline = (label: string): LiveBand => ({
    visible: true,
    phase: "offline",
    tone: "warning",
    label,
    countLabel: "",
    count: 0,
  });

  // Un error explícito de la API manda: es el motivo real del corte.
  if (error) return offline(error);

  if (phase === null) {
    return {
      visible: true,
      phase: "connecting",
      tone: "pending",
      label: "Conectando al live…",
      countLabel: "",
      count: 0,
    };
  }

  if (!connected) return offline("Sin conexión al live, reintentando");

  const count = totals?.qualified ?? 0;
  const store = at(input.storeLabel);
  return {
    visible: true,
    phase: "live",
    tone: "live",
    label: store ? `🔴 EN VIVO · ${store}` : "🔴 EN VIVO",
    countLabel: `${count} con intención`,
    count,
  };
}

/**
 * Suma las filas del stream a la lista de la bandeja.
 * `freshKeys` son las claves que no existían antes: solo esas destellan.
 */
export function mergeLiveRows(
  conversations: Conversation[],
  rows: LeadRow[],
  store: { storeId: string; storeLabel: string },
): { conversations: Conversation[]; freshKeys: string[] } {
  const byKey = new Map(conversations.map((conv) => [conv.key, conv]));
  const fresh: Conversation[] = [];
  const freshKeys: string[] = [];
  const updated = [...conversations];

  for (const row of rows) {
    const key = `${store.storeId}:${row.tiktokUserId}`;
    const outcome = leadOutcome(row);
    const text = leadMessage(row) ?? "";
    const prev = byKey.get(key);

    if (!prev) {
      freshKeys.push(key);
      const created: Conversation = {
        key,
        tiktokUserId: row.tiktokUserId,
        storeId: store.storeId,
        storeLabel: store.storeLabel,
        name: row.displayId || row.nickname || "Anónimo",
        totalMessages: row.comments,
        lastText: text,
        lastAt: row.firstSeen,
        liveTags: [],
        closed: null,
        unread: true,
        outcome,
      };
      fresh.push(created);
      continue;
    }

    updated[updated.indexOf(prev)] = {
      ...prev,
      name: row.displayId || row.nickname || prev.name,
      totalMessages: Math.max(prev.totalMessages, row.comments),
      lastText: text || prev.lastText,
      lastAt: Math.max(prev.lastAt, row.firstSeen),
      outcome,
    };
  }

  // Lo nuevo va arriba: es lo que el vendedor tiene que ver primero.
  return { conversations: [...fresh, ...updated], freshKeys };
}
