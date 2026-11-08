/**
 * Etapas del embudo y sus tokens de presentación.
 * Las decide el servidor; acá solo viven los nombres y los colores.
 */
export type LeadStage = "compra" | "negociando" | "interesado";

/** Orden del embudo: de la intención más fuerte a la más tibia. */
export const STAGE_ORDER: LeadStage[] = ["compra", "negociando", "interesado"];

export const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; funnelPct: string }> = {
  interesado: { label: "Interesado", color: "#4ade80", funnelPct: "35%" },
  negociando: { label: "Negociando", color: "#facc15", funnelPct: "65%" },
  compra: { label: "Compra", color: "#fe2c55", funnelPct: "97%" },
};

/** Conteos por etapa cuando el stream todavía no mandó `totals`. */
export const NO_STAGE_COUNTS: Record<LeadStage, number> = {
  compra: 0,
  negociando: 0,
  interesado: 0,
};
