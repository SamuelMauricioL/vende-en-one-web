

export type LeadStage = "compra" | "negociando" | "interesado";

export const STAGE_ORDER: LeadStage[] = ["compra", "negociando", "interesado"];

export const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; funnelPct: string }> = {
  interesado: { label: "Interesado", color: "#4ade80", funnelPct: "35%" },
  negociando: { label: "Negociando", color: "#facc15", funnelPct: "65%" },
  compra: { label: "Compra", color: "#fe2c55", funnelPct: "97%" },
};

export const NO_STAGE_COUNTS: Record<LeadStage, number> = {
  compra: 0,
  negociando: 0,
  interesado: 0,
};
