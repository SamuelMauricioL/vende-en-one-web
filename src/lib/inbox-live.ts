

import { leadMessage, leadOutcome, type LeadRow, type Totals } from "./filters-api.ts";
import type { Conversation } from "./inbox-api.ts";

export type LivePhase = "idle" | "live" | "ended";

export type StoreFrame =
  | {
      type: "status";
      state: LivePhase;
      sessionId: string | null;
      username: string | null;

      error?: string;
    }
  | { type: "stats"; stats: LeadRow[]; totals: Totals }
  | { type: "chat"; chat: readonly unknown[] }
  | { type: "outcome"; lead: LeadRow };

export interface LiveStreamState {
  phase: LivePhase | null;
  sessionId: string | null;
  username: string | null;

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

        rows: phase === "live" ? state.rows : null,
      };
    }
    case "stats":

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

      return state;
  }
}

export interface LiveBand {

  visible: boolean;
  phase: "hidden" | "connecting" | "live" | "offline";
  tone: "live" | "pending" | "warning";

  label: string;

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

  return { conversations: [...fresh, ...updated], freshKeys };
}
