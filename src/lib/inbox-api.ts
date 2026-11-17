

export type LeadState = "contactado" | "whatsapp" | "ignorado";
export type IgnoreReason = "no_cliente" | "spam" | "ya_compro";

export const OUTCOME_LABEL: Record<LeadState, string> = {
  contactado: "Contactado",
  whatsapp: "En WhatsApp",
  ignorado: "Atendido",
};

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

export interface InboxRow {
  tiktokUserId: string;
  displayId?: string;
  nickname?: string;
  totalMessages: number;
  lastText: string;
  lastAt: number;
  sessions: Record<string, { count: number; endedAt: number }>;
}

export interface InboxLead {
  tiktokUserId: string;
  state: LeadState;
  closedAt: number;

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

  key: string;
  tiktokUserId: string;

  storeId: string;

  storeLabel: string;
  name: string;
  totalMessages: number;
  lastText: string;
  lastAt: number;
  liveTags: LiveTag[];
  closed: InboxLead | null;
  unread: boolean;

  outcome?: LeadState | null;
}

export interface ThreadMessage {
  sessionId: string;
  text: string;
  createdAt: number;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

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

export function isClosed(lead: InboxLead | null | undefined, lastAt: number): boolean {
  if (!lead) return false;
  return (lead.closedThrough ?? lead.closedAt) >= lastAt;
}

export function isUnread(lastAt: number, lead: InboxLead | null | undefined): boolean {
  return (lead?.lastSeenAt ?? 0) < lastAt;
}

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

  return list.sort((a, b) => {
    if (!!a.closed !== !!b.closed) return a.closed ? 1 : -1;
    return b.lastAt - a.lastAt;
  });
}

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

export function pickActiveStore<T extends StoreOption>(
  stores: T[],
  savedId?: string | null,
): T | null {
  if (savedId) {
    const bySaved = stores.find((s) => s._id === savedId);
    if (bySaved) return bySaved;
  }
  return stores[0] ?? null;
}
