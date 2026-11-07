/**
 * Modelo del bucle cerrado de rescate.
 * Persistencia v1 en localStorage; ver odd/tasks/inbox.md (S1-S7).
 *
 * Nada queda "solo leído": una conversación cierra cuando tiene un desenlace
 * explícito (contactado | whatsapp | ignorado) y se reabre si la persona
 * vuelve a escribir después de ese cierre.
 */

import type { LeadStage } from "./lead-classifier";

export type Outcome = "contactado" | "whatsapp" | "ignorado";
export type IgnoreReason = "no_cliente" | "spam" | "ya_compro";

export const OUTCOME_LABEL: Record<Outcome, string> = {
  contactado: "Contactado",
  whatsapp: "En WhatsApp",
  ignorado: "Ignorado",
};

export const IGNORE_REASONS: { key: IgnoreReason; label: string }[] = [
  { key: "no_cliente", label: "No es cliente" },
  { key: "spam", label: "Spam o broma" },
  { key: "ya_compro", label: "Ya compró" },
];

export interface InboxEntry {
  /** Sin `state` la conversación sigue abierta aunque se haya visto. */
  state?: Outcome;
  closedAt?: number;
  /** Último mensaje que el vendedor tenía delante al cerrar: habilita la reapertura. */
  closedThrough?: number;
  reason?: IgnoreReason;
  waNumber?: string;
  lastSeenAt?: number;
}

export type InboxState = Record<string, InboxEntry>;

/** Se inyecta desde la app para que este módulo no dependa del clasificador. */
export type ClassifyStage = (texts: string[]) => LeadStage | null;

export interface InboxMessage {
  at: number;
  text: string;
  sessionId: string;
  liveEndedAt: number;
}

export interface InboxSessionInput {
  _id: string;
  username: string;
  status: string;
  startedAt: number;
  endedAt?: number;
  summary: null | {
    chat: Array<{
      id?: string;
      tiktokUserId?: string;
      displayId?: string;
      nickname?: string;
      comment: string;
      createdAt: number;
    }>;
  };
}

export interface LiveTag {
  sessionId: string;
  endedAt: number;
  count: number;
  label: string;
  /** Etapa detectada solo con los comentarios de ESE live. */
  stage: LeadStage | null;
}

export interface Conversation {
  key: string;
  tiktokUserId: string;
  name: string;
  totalMessages: number;
  lastMessage: string;
  lastAt: number;
  messages: InboxMessage[];
  liveTags: LiveTag[];
  closed: (InboxEntry & { state: Outcome; closedAt: number }) | null;
}

const STORAGE_KEY = "ll_inbox_state";
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** La tienda entra en la clave: el mismo TikTok puede vigilarse desde dos cuentas. */
export function keyOf(store: string, tiktokUserId: string): string {
  return `${store}:${tiktokUserId}`;
}

/** "7 nov" — etiqueta de live y separador de fecha del hilo. */
export function liveLabel(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function loadState(): InboxState {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InboxState) : {};
  } catch {
    return {};
  }
}

export function saveState(state: InboxState): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // modo privado o cuota llena: el bucle sigue funcionando en memoria
  }
}

export function markSeen(state: InboxState, store: string, id: string, at: number): InboxState {
  const key = keyOf(store, id);
  const prev = state[key] ?? {};
  const lastSeenAt = Math.max(prev.lastSeenAt ?? 0, at);
  return { ...state, [key]: { ...prev, lastSeenAt } };
}

export function setOutcome(
  state: InboxState,
  store: string,
  id: string,
  at: number,
  outcome: Outcome,
  extra?: { reason?: IgnoreReason; waNumber?: string; through?: number },
): InboxState {
  const key = keyOf(store, id);
  const prev = state[key] ?? {};
  return {
    ...state,
    [key]: {
      ...prev,
      state: outcome,
      closedAt: at,
      closedThrough: extra?.through,
      reason: extra?.reason,
      waNumber: extra?.waNumber,
    },
  };
}

export function clearOutcome(state: InboxState, store: string, id: string): InboxState {
  const key = keyOf(store, id);
  const prev = state[key];
  if (!prev) return state;
  const { state: _s, closedAt: _c, closedThrough: _t, reason: _r, waNumber: _w, ...rest } = prev;
  return { ...state, [key]: rest };
}

export function closedOutcome(state: InboxState, store: string, id: string): InboxEntry | null {
  const entry = state[keyOf(store, id)];
  return entry?.state && entry.closedAt != null ? entry : null;
}

export function isUnread(conv: Conversation, entry?: InboxEntry): boolean {
  return (entry?.lastSeenAt ?? 0) < conv.lastAt;
}

/** Deriva las conversaciones de una persona a partir de las sesiones del API. */
export function buildConversations(
  sessions: InboxSessionInput[],
  store: string,
  state: InboxState,
  classifyStage?: ClassifyStage,
): Conversation[] {
  const byUser = new Map<string, { name: string; messages: InboxMessage[] }>();

  for (const session of sessions) {
    if (!session.summary || session.status === "error") continue;
    const endedAt = session.endedAt ?? session.startedAt;
    for (const msg of session.summary.chat) {
      if (!msg.tiktokUserId) continue;
      const entry = byUser.get(msg.tiktokUserId) ?? {
        name: msg.displayId || msg.nickname || "Anónimo",
        messages: [],
      };
      entry.messages.push({
        at: msg.createdAt,
        text: msg.comment,
        sessionId: session._id,
        liveEndedAt: endedAt,
      });
      byUser.set(msg.tiktokUserId, entry);
    }
  }

  const list: Conversation[] = [...byUser.entries()].map(([id, { name, messages }]) => {
    messages.sort((a, b) => a.at - b.at);
    const tags = new Map<string, LiveTag>();
    const textsByLive = new Map<string, string[]>();
    for (const m of messages) {
      const tag = tags.get(m.sessionId) ?? {
        sessionId: m.sessionId,
        endedAt: m.liveEndedAt,
        count: 0,
        label: liveLabel(m.liveEndedAt),
        stage: null,
      };
      tag.count++;
      tags.set(m.sessionId, tag);
      const texts = textsByLive.get(m.sessionId) ?? [];
      texts.push(m.text);
      textsByLive.set(m.sessionId, texts);
    }
    for (const [sessionId, tag] of tags) {
      tag.stage = classifyStage ? classifyStage(textsByLive.get(sessionId) ?? []) : null;
    }
    const entry = state[keyOf(store, id)];
    const lastAt = messages[messages.length - 1].at;
    // Reabre solo si llegó un mensaje posterior al que se cubrió al cerrar.
    // No se compara con la hora del cierre: el reloj del live puede venir adelantado.
    const closedThrough = entry?.closedThrough ?? entry?.closedAt ?? 0;
    const closed =
      entry?.state && entry.closedAt != null && closedThrough >= lastAt
        ? { ...entry, state: entry.state, closedAt: entry.closedAt }
        : null;

    return {
      key: keyOf(store, id),
      tiktokUserId: id,
      name,
      totalMessages: messages.length,
      lastMessage: messages[messages.length - 1].text,
      lastAt,
      messages,
      liveTags: [...tags.values()].sort((a, b) => b.endedAt - a.endedAt),
      closed,
    };
  });

  // Abiertas primero; dentro de cada grupo, la conversación más reciente arriba.
  return list.sort((a, b) => {
    if (!!a.closed !== !!b.closed) return a.closed ? 1 : -1;
    return b.lastAt - a.lastAt;
  });
}

/** "1h 12min" — duración de una sesión. */
export function durationLabel(startedAt: number, endedAt?: number): string {
  const min = Math.max(1, Math.round(((endedAt ?? Date.now()) - startedAt) / 60000));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

/** Conteo por etapa de las conversaciones que participaron en ese live. */
export function stageCountsForLive(
  conversations: Conversation[],
  sessionId: string,
): Record<LeadStage, number> {
  const counts: Record<LeadStage, number> = { compra: 0, negociando: 0, interesado: 0 };
  for (const conv of conversations) {
    const tag = conv.liveTags.find((t) => t.sessionId === sessionId);
    if (tag?.stage) counts[tag.stage]++;
  }
  return counts;
}

/** Cuántas conversaciones con mensajes de ese live siguen sin desenlace. */
export function pendingForLive(conversations: Conversation[], sessionId: string): number {
  return conversations.filter(
    (c) => !c.closed && c.liveTags.some((t) => t.sessionId === sessionId),
  ).length;
}
