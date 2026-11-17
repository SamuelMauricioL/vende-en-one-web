

export const AUTOPLAY_MS = 5500;

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

export function shouldAutoplay(reducedMotion: boolean, paused: boolean): boolean {
  return !reducedMotion && !paused;
}

export function shouldPauseOnFocus(focusWithin: boolean, hovering = false): boolean {
  return focusWithin || hovering;
}
