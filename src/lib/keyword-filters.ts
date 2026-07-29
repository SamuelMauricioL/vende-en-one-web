import type { LeadStage } from "./lead-classifier";

export interface KeywordCategory {
  id: string;
  name: string;
  keywords: string[];
  color: string;
  stage: LeadStage; // ← etapa asociada: "compra" | "negociando" | "interesado"
}

const STORAGE_KEY = "customKeywordFilters";

/* ── Persistencia ── */

export function loadFilters(): KeywordCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFilters(filters: KeywordCategory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ── Clasificación por keywords personalizadas ── */

/**
 * Revisa si algún mensaje coincide con keywords de filtros personalizados.
 * Si hay match, retorna la etapa asociada al filtro.
 * Si hay múltiples matches de distintas etapas, prioriza: compra > negociando > interesado.
 */
export function customStageOverride(
  comments: string[],
  filters: KeywordCategory[],
): LeadStage | null {
  if (!comments || !comments.length || !filters.length) return null;

  const allText = comments.join(" ");
  let matchedStage: LeadStage | null = null;
  let matchedPriority = -1;

  const stagePriority: Record<LeadStage, number> = {
    compra: 3,
    negociando: 2,
    interesado: 1,
  };

  for (const cat of filters) {
    if (!cat.stage) continue;
    for (const kw of cat.keywords) {
      if (!kw.trim()) continue;
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "gi");
      if (regex.test(allText)) {
        const pri = stagePriority[cat.stage] ?? 0;
        if (pri > matchedPriority) {
          matchedPriority = pri;
          matchedStage = cat.stage;
        }
      }
    }
  }

  return matchedStage;
}

/* ── Resaltado en mensajes ── */

export interface HighlightPart {
  text: string;
  bold: boolean;
}

interface RawMatch {
  start: number;
  end: number;
}

function findRawMatches(text: string, filters: KeywordCategory[]): RawMatch[] {
  if (!filters.length) return [];

  const matches: RawMatch[] = [];

  for (const cat of filters) {
    for (const kw of cat.keywords) {
      if (!kw.trim()) continue;
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "gi");
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length });
      }
    }
  }

  // Sort by position, then merge overlapping ranges
  matches.sort((a, b) => a.start - b.start);
  const merged: RawMatch[] = [];
  for (const m of matches) {
    const last = merged[merged.length - 1];
    if (last && m.start <= last.end) {
      last.end = Math.max(last.end, m.end);
    } else {
      merged.push({ ...m });
    }
  }

  return merged;
}

export function getHighlightParts(
  text: string,
  filters: KeywordCategory[],
): HighlightPart[] {
  const matches = findRawMatches(text, filters);
  if (!matches.length) return [{ text, bold: false }];

  const parts: HighlightPart[] = [];
  let cursor = 0;

  for (const m of matches) {
    if (m.start > cursor) {
      parts.push({ text: text.slice(cursor, m.start), bold: false });
    }
    parts.push({ text: text.slice(m.start, m.end), bold: true });
    cursor = m.end;
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), bold: false });
  }

  return parts;
}
