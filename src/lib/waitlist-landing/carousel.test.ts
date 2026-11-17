import { test } from "node:test";
import assert from "node:assert/strict";

import { AUTOPLAY_MS, go, next, prev, shouldAutoplay, shouldPauseOnFocus } from "./carousel.ts";

const TOTAL = 3;

test("go envuelve en los dos sentidos", () => {
  assert.equal(go(0, TOTAL), 0);
  assert.equal(go(2, TOTAL), 2);
  assert.equal(go(3, TOTAL), 0);
  assert.equal(go(-1, TOTAL), 2);
  assert.equal(go(-4, TOTAL), 2);
  assert.equal(go(7, TOTAL), 1);
});

test("go sin capturas no rompe", () => {
  assert.equal(go(2, 0), 0);
});

test("next y prev dan la vuelta en los extremos", () => {
  assert.equal(next(0, TOTAL), 1);
  assert.equal(next(TOTAL - 1, TOTAL), 0);
  assert.equal(prev(0, TOTAL), TOTAL - 1);
  assert.equal(prev(TOTAL - 1, TOTAL), TOTAL - 2);
});

test("sin avance automático con movimiento reducido ni en pausa", () => {
  assert.equal(shouldAutoplay(false, false), true);
  assert.equal(shouldAutoplay(true, false), false);
  assert.equal(shouldAutoplay(false, true), false);
  assert.equal(shouldAutoplay(true, true), false);
});

test("el foco dentro del carrusel pausa, y el mouse encima también", () => {
  assert.equal(shouldPauseOnFocus(true, false), true);
  assert.equal(shouldPauseOnFocus(false, true), true);
  assert.equal(shouldPauseOnFocus(true, true), true);
  assert.equal(shouldPauseOnFocus(false, false), false);
});

test("el avance automático del demo son 5,5 s", () => {
  assert.equal(AUTOPLAY_MS, 5500);
});
