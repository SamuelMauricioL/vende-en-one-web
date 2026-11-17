/**
 * S5 de `odd/tasks/landing-waitlist.md`: el carrusel del hero como funciones
 * puras, para probar índice, envolvente, pausa y reanudación sin navegador.
 */

/** El demo avanza cada 5,5 s; con `prefers-reduced-motion` no avanza. */
export const AUTOPLAY_MS = 5500;

/** Lleva cualquier índice al rango `0..total-1`, también en negativo. */
export function go(index: number, total: number): number {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

export function next(index: number, total: number): number {
  return go(index + 1, total);
}

export function prev(index: number, total: number): number {
  return go(index - 1, total);
}

/** S5/S12: sin avance automático si el sistema pide movimiento reducido o hay pausa. */
export function shouldAutoplay(reducedMotion: boolean, paused: boolean): boolean {
  return !reducedMotion && !paused;
}

/** S5: el mouse encima y el foco del teclado pausan igual. */
export function shouldPauseOnFocus(focusWithin: boolean, hovering = false): boolean {
  return focusWithin || hovering;
}
