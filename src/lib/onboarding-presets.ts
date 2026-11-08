import type { KeywordFilterPayload } from "./keyword-filters.ts";

export interface OnboardingPreset extends KeywordFilterPayload {
  /** Clave local para la lista y el ejemplo; el servidor asigna el id real. */
  id: string;
}

/**
 * Presets de filtros que se ofrecen en el onboarding (S3).
 * Son payload: se crean en el servidor con `POST /stores/:storeId/filters`,
 * que los deduplica por nombre, así que reenviarlos no duplica nada.
 */
export const ONBOARDING_PRESETS: OnboardingPreset[] = [
  {
    id: "preset-compra",
    name: "Quiere comprar",
    keywords: ["separo", "quiero", "lo llevo", "me la", "link", "yape"],
    stage: "compra",
  },
  {
    id: "preset-precio",
    name: "Pregunta precio",
    keywords: ["precio", "cuanto", "cuánto", "cuesta"],
    stage: "negociando",
  },
  {
    id: "preset-talla",
    name: "Pregunta talla",
    keywords: ["talla", "color", "medida"],
    stage: "negociando",
  },
  {
    id: "preset-envio",
    name: "Envío",
    keywords: ["envio", "envío", "envi", "enví", "provincia", "delivery", "llega"],
    stage: "negociando",
  },
];
