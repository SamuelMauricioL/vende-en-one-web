import type { LeadStage } from "./stages.ts";

/**
 * Payload de un filtro tal como lo acepta `POST /api/stores/:storeId/filters`.
 * La fuente de verdad es el servidor (S1, S9): acá no se persiste nada.
 */
export interface KeywordFilterPayload {
  name: string;
  keywords: string[];
  stage: LeadStage;
}
