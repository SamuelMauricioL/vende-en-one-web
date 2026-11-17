

import { authHeaders, type GetToken } from "./api-auth.ts";
import type { LeadState } from "./inbox-api.ts";
import { STAGE_ORDER, type LeadStage } from "./stages.ts";

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

  comments: number;

  commentTexts: string[];
  stage: LeadStage;

  stageLabel: string;

  spans: Span[];
  score: number;

  outcome?: LeadState | null;
}

export interface Totals {
  commented: number;
  qualified: number;
  byStage: Record<LeadStage, number>;
}

export type StatsFrame =

  | { type: "initial" | "update"; stats: LeadRow[]; totals: Totals }
  | { type: "status"; status: string; error?: string };

export type FilterAction = "classify" | "discard";

export interface FilterView {

  source: "system" | "store";
  id: string;
  name: string;
  keywords: string[];
  action: FilterAction;

  stage: LeadStage | null;
  editable: boolean;
}

export type StageFilter = FilterView & { action: "classify"; stage: LeadStage };

export interface FilterInput {
  keywords: string[];
  name?: string;
  stage?: LeadStage;
}

export type FilterPatch = Partial<FilterInput>;

export function normalizeFilters(filters: readonly FilterView[]): FilterView[] {
  const seen = new Set<string>();
  const list: FilterView[] = [];
  for (const filter of filters) {
    const key = filter.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);

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

export function discardFilters(filters: readonly FilterView[]): FilterView[] {
  return filters.filter((filter) => filter.action === "discard");
}

export function groupFiltersByStage(
  filters: readonly FilterView[],
): { stage: LeadStage; filters: StageFilter[] }[] {
  const classified = filters.filter(isStageFilter);
  return STAGE_ORDER.map((stage) => ({
    stage,
    filters: classified.filter((filter) => filter.stage === stage),
  })).filter((group) => group.filters.length > 0);
}

export function leadMessage(lead: LeadRow): string | null {
  if (lead.spans.length > 0) return lead.spans.map((span) => span.text).join("");
  return lead.commentTexts[0] ?? null;
}

export function leadOutcome(lead: LeadRow): LeadState | null {
  const outcome = lead.outcome;
  if (outcome === "contactado" || outcome === "whatsapp" || outcome === "ignorado") {
    return outcome;
  }
  return null;
}

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

    }
    throw new Error(detail || `El servidor respondió ${res.status}`);
  }

  return (await res.json()) as T;
}

function filtersPath(storeId: string): string {
  return `/api/stores/${encodeURIComponent(storeId)}/filters`;
}

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
