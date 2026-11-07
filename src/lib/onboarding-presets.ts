import type { KeywordCategory } from "./keyword-filters";

/**
 * Presets de filtros que se ofrecen en el onboarding.
 * Salen del prototipo (Quiere comprar, Pregunta precio, Pregunta talla, Envío)
 * mapeados a las etapas que ya usa la web.
 *
 * Los colores son los de la PALETTE de `filters-page.tsx`, en el mismo orden,
 * para que un preset se vea igual que un filtro creado a mano.
 */
export const ONBOARDING_PRESETS: KeywordCategory[] = [
  {
    id: "preset-compra",
    name: "Quiere comprar",
    keywords: ["separo", "quiero", "lo llevo", "me la", "link", "yape"],
    color: "#fe2c55",
    stage: "compra",
  },
  {
    id: "preset-precio",
    name: "Pregunta precio",
    keywords: ["precio", "cuanto", "cuánto", "cuesta"],
    color: "#25f4ee",
    stage: "negociando",
  },
  {
    id: "preset-talla",
    name: "Pregunta talla",
    keywords: ["talla", "color", "medida"],
    color: "#facc15",
    stage: "negociando",
  },
  {
    id: "preset-envio",
    name: "Envío",
    keywords: ["envio", "envío", "envi", "enví", "provincia", "delivery", "llega"],
    color: "#4ade80",
    stage: "negociando",
  },
];
