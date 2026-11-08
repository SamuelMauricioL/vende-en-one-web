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
}): LiveBand {
  const { phase, connected, totals } = input;
  if (phase === "idle" || phase === "ended") return HIDDEN;

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

  if (!connected) {
    return {
      visible: true,
      phase: "offline",
      tone: "warning",
      label: "Sin conexión al live, reintentando",
      countLabel: "",
      count: 0,
    };
  }

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
