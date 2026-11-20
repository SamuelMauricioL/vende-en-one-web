import { test } from "node:test";
import assert from "node:assert/strict";

import { maskEmail, maskName } from "./mask.ts";

test("un correo de gmail deja ver tres caracteres y el dominio", () => {
  assert.equal(maskEmail("samuel@gmail.com"), "sam***@gmail.com");
});

test("un correo de otro dominio conserva el dominio real", () => {
  assert.equal(maskEmail("samuel@outlook.com"), "sam***@outlook.com");
});

test("un correo con parte local corta se enmascara igual", () => {
  assert.equal(maskEmail("al@gmail.com"), "al***@gmail.com");
});

test("los espacios alrededor del correo no cuentan", () => {
  assert.equal(maskEmail("  samuel@gmail.com  "), "sam***@gmail.com");
});

test("un correo sin arroba no muestra nada", () => {
  assert.equal(maskEmail("sin arroba"), "");
  assert.equal(maskEmail(""), "");
});

test("un nombre deja ver tres caracteres y tapa el resto", () => {
  assert.equal(maskName("Samuel Alberto"), "Sam***");
});

test("un nombre de tres caracteres se enmascara con la misma regla", () => {
  assert.equal(maskName("Ana"), "Ana***");
});

test("un nombre de dos caracteres se enmascara con la misma regla", () => {
  assert.equal(maskName("Al"), "Al***");
});

test("un nombre vacío no muestra nada", () => {
  assert.equal(maskName(""), "");
  assert.equal(maskName("   "), "");
});

test("el correo que se muestra nunca incluye la parte local completa", () => {
  const shown = maskEmail("samuelprolongado@gmail.com");
  assert.equal(shown, "sam***@gmail.com");
  assert.equal(shown.includes("samuelprolongado"), false);
});
