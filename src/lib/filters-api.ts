/**
 * Contrato del API para filtros y stats (S8).
 * El criterio de matching, la etapa, el orden y el resaltado viven en el
 * servidor: acá solo se mapea lo que llega y se define cómo se pide/guarda.
 */
import { authHeaders, type GetToken } from "./api-auth.ts";
import type { LeadState } from "./inbox-api.ts";
import { STAGE_ORDER, type LeadStage } from "./stages.ts";

/* ── Contrato de stats (S8) ── */

export interface Span {
  text: string;
  strong: boolean;
}

export interface LeadRow {
  tiktokUserId: string;
  displayId?: string;
  nickname?: string;
  verified?: boolean;
  followerCount?: string;
  firstSeen: number;
  /** Solo coincidencias. */
  comments: number;
  /** Solo coincidencias, texto plano. */
  commentTexts: string[];
  stage: LeadStage;
  /** Nombre del filtro que lo puso en esa etapa. */
  stageLabel: string;
  /** Frase clave ya segmentada por el servidor. */
  spans: Span[];
  score: number;
  /** S10: desenlace que produjo el resolutor desde la bandeja (null si no hay). */
  outcome?: LeadState | null;
}

export interface Totals {
  commented: number;
  qualified: number;
  byStage: Record<LeadStage, number>;
}

export type StatsFrame =
  // Siempre la lista completa ya ordenada: el navegador reemplaza y no reordena.
  | { type: "initial" | "update"; stats: LeadRow[]; totals: Totals }
  | { type: "status"; status: string; error?: string };

/* ── Contrato de filtros (S8) ── */

/** S11: "discard" no clasifica, descarta el comentario en el servidor. */
export type FilterAction = "classify" | "discard";

export interface FilterView {
  /** Solo "store" es editable/borrable. */
  source: "system" | "store";
  id: string;
  name: string;
  keywords: string[];
  action: FilterAction;
  /** null solo en los filtros que descartan: no tienen etapa. */
  stage: LeadStage | null;
  editable: boolean;
}

/** Un filtro que clasifica: siempre tiene etapa. */
export type StageFilter = FilterView & { action: "classify"; stage: LeadStage };

export interface FilterInput {
  keywords: string[];
  name?: string;
  stage?: LeadStage;
}

export type FilterPatch = Partial<FilterInput>;

/* ── Helpers de lectura (el navegador solo muestra) ── */

/** Deduplica por nombre normalizado: el servidor ya lo hace, esto protege la lista. */
export function normalizeFilters(filters: readonly FilterView[]): FilterView[] {
  const seen = new Set<string>();
  const list: FilterView[] = [];
  for (const filter of filters) {
    const key = filter.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    // S11: un filtro que descarta no tiene etapa y nunca es editable.
    list.push(
      filter.action === "discard"
        ? { ...filter, action: "discard", stage: null, editable: false }
        : { ...filter, action: "classify" },
    );
  }
  return list;
}

export function isStageFilter(filter: FilterView): filter is StageFilter {
  return filter.action === "classify" && filter.stage !== null;
}

/** S11: filtros que descartan el mensaje, fuera de los grupos por etapa. */
export function discardFilters(filters: readonly FilterView[]): FilterView[] {
  return filters.filter((filter) => filter.action === "discard");
}

/** Agrupa por etapa conservando el orden del servidor. Los de descarte quedan fuera. */
export function groupFiltersByStage(
  filters: readonly FilterView[],
): { stage: LeadStage; filters: StageFilter[] }[] {
  const classified = filters.filter(isStageFilter);
  return STAGE_ORDER.map((stage) => ({
    stage,
    filters: classified.filter((filter) => filter.stage === stage),
  })).filter((group) => group.filters.length > 0);
}

/** Texto para la vista previa de la fila: la frase que ya segmentó el servidor. */
export function leadMessage(lead: LeadRow): string | null {
  if (lead.spans.length > 0) return lead.spans.map((span) => span.text).join("");
  return lead.commentTexts[0] ?? null;
}

/**
 * S10: el vendedor no marca atendido, ve el estado que produjo el resolutor.
 * Un valor que no conocemos se ignora: mejor sin marca que con una inventada.
 */
export function leadOutcome(lead: LeadRow): LeadState | null {
  const outcome = lead.outcome;
  if (outcome === "contactado" || outcome === "whatsapp" || outcome === "ignorado") {
    return outcome;
  }
  return null;
}

/* ── Cliente HTTP ── */

async function request<T>(path: string, init: RequestInit, getToken?: GetToken): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders(getToken)),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: string };
      detail = body.error ?? "";
    } catch {
      // respuesta sin JSON: se reporta el status
    }
    throw new Error(detail || `El servidor respondió ${res.status}`);
  }

  return (await res.json()) as T;
}

function filtersPath(storeId: string): string {
  return `/api/stores/${encodeURIComponent(storeId)}/filters`;
}

/** S1: los filtros son de la tienda activa. */
export async function fetchFilters(storeId: string, getToken?: GetToken): Promise<FilterView[]> {
  const body = await request<{ filters?: FilterView[] }>(
    filtersPath(storeId),
    { method: "GET" },
    getToken,
  );
  return normalizeFilters(body.filters ?? []);
}

export async function createFilter(
  storeId: string,
  input: FilterInput,
  getToken?: GetToken,
): Promise<FilterView> {
  const body = await request<{ filter: FilterView }>(
    filtersPath(storeId),
    { method: "POST", body: JSON.stringify(input) },
    getToken,
  );
  return body.filter;
}

export async function updateFilter(
  storeId: string,
  id: string,
  patch: FilterPatch,
  getToken?: GetToken,
): Promise<FilterView> {
  const body = await request<{ filter: FilterView }>(
    `${filtersPath(storeId)}/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    getToken,
  );
  return body.filter;
}

export async function deleteFilter(
  storeId: string,
  id: string,
  getToken?: GetToken,
): Promise<void> {
  await request<{ ok: true }>(
    `${filtersPath(storeId)}/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    getToken,
  );
}
