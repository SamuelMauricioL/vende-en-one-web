/**
 * S4 de `odd/tasks/landing-waitlist.md`: la landing no inventa diseño propio,
 * usa los tokens del sitio (`--bg #0b0f1a`, `--brand #fe2c55`,
 * `--brand-2 #25f4ee`, Inter + JetBrains Mono). Lo que se repite entre bloques
 * vive acá para no repetirlo en cada componente.
 */

export const card = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
};

export const primaryButton =
  "inline-flex items-center justify-center h-12 rounded-xl px-7 text-sm font-bold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#25f4ee]/60";

export const primaryStyle = { background: "linear-gradient(135deg, #fe2c55, #e8254a)" };

export const ghostButton =
  "inline-flex items-center justify-center h-12 rounded-xl px-7 text-sm font-bold text-white/70 transition-colors hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/50";

export const ghostStyle = { border: "1px solid rgba(255,255,255,0.10)" };

/** La etiqueta mono del sitio (`De la transmisión a la venta`, `Demo`, …). */
export const monoLabel = "font-mono text-[11px] uppercase tracking-[0.14em] text-white/40";

export const accentText = {
  backgroundImage: "linear-gradient(135deg, #fe2c55, #25f4ee)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export const sectionClass = "py-16 sm:py-24 scroll-mt-28";
