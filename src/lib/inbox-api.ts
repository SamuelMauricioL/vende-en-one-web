/**
 * Bandeja de rescate servida por el API (paso 6).
 * El estado del bucle vive en Convex (`leadStatus`), no en el navegador: acá
 * solo se mapea y se derivan las reglas de lectura.
 */

export type LeadState = "contactado" | "whatsapp" | "ignorado";
export type IgnoreReason = "no_cliente" | "spam" | "ya_compro";

export const OUTCOME_LABEL: Record<LeadState, string> = {
  contactado: "Contactado",
  whatsapp: "En WhatsApp",
  ignorado: "Atendido",
};

/** Color de la marca de estado en las filas. */
export const OUTCOME_COLOR: Record<LeadState, string> = {
  contactado: "#25f4ee",
  whatsapp: "#4ade80",
  ignorado: "rgba(255,255,255,0.4)",
};

export const IGNORE_REASONS: { key: IgnoreReason; label: string }[] = [
  { key: "no_cliente", label: "No es cliente" },
  { key: "spam", label: "Spam o broma" },
  { key: "ya_compro", label: "Ya compró" },
];

/** Fila del agregado que devuelve `GET /stores/:storeId/inbox`. */
export interface InboxRow {
  tiktokUserId: string;
  displayId?: string;
  nickname?: string;
  totalMessages: number;
  lastText: string;
  lastAt: number;
  sessions: Record<string, { count: number; endedAt: number }>;
}

/** Desenlace guardado en `leadStatus`. */
export interface InboxLead {
  tiktokUserId: string;
  state: LeadState;
  closedAt: number;
  /** Último mensaje que el vendedor tenía delante al cerrar. */
  closedThrough?: number;
  reason?: IgnoreReason;
  waNumber?: string;
  lastSeenAt: number;
}

export interface LiveTag {
  sessionId: string;
  endedAt: number;
  count: number;
  label: string;
}

export interface Conversation {
  /** Clave única: la persona dentro de una tienda (el mismo @ puede estar en dos). */
  key: string;
  tiktokUserId: string;
  /** Tienda a la que pertenece la conversación (clave para los desenlaces). */
  storeId: string;
  /** "@tienda" para etiquetar la fila cuando se ven varias a la vez. */
  storeLabel: string;
  name: string;
  totalMessages: number;
  lastText: string;
  lastAt: number;
  liveTags: LiveTag[];
  closed: InboxLead | null;
  unread: boolean;
  /** S10: estado que produjo el resolutor (null si todavía no hay desenlace). */
  outcome?: LeadState | null;
}

export interface ThreadMessage {
  sessionId: string;
  text: string;
  createdAt: number;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "7 nov" — etiqueta del live y separador de fecha del hilo. */
export function liveLabel(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function timeOf(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Reabre si llegó un mensaje posterior al que se cubrió al cerrar.
 * No se compara con `closedAt`: el reloj del live puede venir adelantado.
 */
export function isClosed(lead: InboxLead | null | undefined, lastAt: number): boolean {
  if (!lead) return false;
  return (lead.closedThrough ?? lead.closedAt) >= lastAt;
}

export function isUnread(lastAt: number, lead: InboxLead | null | undefined): boolean {
  return (lead?.lastSeenAt ?? 0) < lastAt;
}

/** Une el agregado del API con los desenlaces en una lista lista para pintar. */
export function mapConversations(
  rows: InboxRow[],
  leads: InboxLead[],
  store?: { storeId: string; storeLabel: string },
): Conversation[] {
  const byUser = new Map(leads.map((l) => [l.tiktokUserId, l]));
  const storeId = store?.storeId ?? "";
  const storeLabel = store?.storeLabel ?? "";

  const list: Conversation[] = rows.map((row) => {
    const lead = byUser.get(row.tiktokUserId) ?? null;
    const liveTags: LiveTag[] = Object.entries(row.sessions ?? {})
      .map(([sessionId, value]) => ({
        sessionId,
        endedAt: value.endedAt,
        count: value.count,
        label: liveLabel(value.endedAt),
      }))
      .sort((a, b) => b.endedAt - a.endedAt);

    return {
      key: `${storeId}:${row.tiktokUserId}`,
      tiktokUserId: row.tiktokUserId,
      storeId,
      storeLabel,
      name: row.displayId || row.nickname || "Anónimo",
      totalMessages: row.totalMessages,
      lastText: row.lastText,
      lastAt: row.lastAt,
      liveTags,
      closed: isClosed(lead, row.lastAt) ? lead : null,
      unread: isUnread(row.lastAt, lead),
      outcome: lead?.state ?? null,
    };
  });

  // Pendientes primero; dentro de cada grupo, la conversación más reciente arriba.
  return list.sort((a, b) => {
    if (!!a.closed !== !!b.closed) return a.closed ? 1 : -1;
    return b.lastAt - a.lastAt;
  });
}

/** Lives presentes en la bandeja, con cuántas conversaciones siguen pendientes. */
export function liveFilters(conversations: Conversation[]): {
  sessionId: string;
  label: string;
  pending: number;
}[] {
  const map = new Map<string, { label: string; endedAt: number; pending: number }>();
  for (const conv of conversations) {
    for (const tag of conv.liveTags) {
      const entry = map.get(tag.sessionId) ?? { label: tag.label, endedAt: tag.endedAt, pending: 0 };
      if (!conv.closed) entry.pending++;
      map.set(tag.sessionId, entry);
    }
  }
  return [...map.entries()]
    .sort((a, b) => b[1].endedAt - a[1].endedAt)
    .map(([sessionId, v]) => ({ sessionId, label: v.label, pending: v.pending }));
}

/** Agrupa el hilo por día con su separador, como WhatsApp. */
export function groupThread(
  messages: ThreadMessage[],
): { key: string; label: string; items: ThreadMessage[] }[] {
  const groups: { key: string; label: string; items: ThreadMessage[] }[] = [];
  for (const msg of messages) {
    const key = dayKey(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(msg);
    else groups.push({ key, label: liveLabel(msg.createdAt), items: [msg] });
  }
  return groups;
}

export function pendingTotal(conversations: Conversation[]): number {
  return conversations.filter((c) => !c.closed).length;
}

export interface StoreOption {
  _id: string;
  tiktokUsername: string;
}

/**
 * Elige la tienda activa de la bandeja.
 * Prioridad: la tienda guardada (elección explícita en el menú), luego el `@`
 * del perfil y por último la primera. Si el perfil mandara sobre la elección,
 * cambiar de tienda no tendría efecto en Live ni en Bandeja.
 */
export function pickActiveStore<T extends StoreOption>(
  stores: T[],
  profileHandle: string | undefined,
  savedId?: string | null,
): T | null {
  const norm = (v: string) => v.replace(/^@/, "").trim().toLowerCase();

  // La elección explícita del menú GANA sobre el @ del perfil: si el perfil
  // apunta a la cuenta vieja, no debe impedir trabajar con la tienda elegida.
  if (savedId) {
    const bySaved = stores.find((s) => s._id === savedId);
    if (bySaved) return bySaved;
  }
  if (profileHandle) {
    const byProfile = stores.find((s) => norm(s.tiktokUsername) === norm(profileHandle));
    if (byProfile) return byProfile;
  }
  return stores[0] ?? null;
}
