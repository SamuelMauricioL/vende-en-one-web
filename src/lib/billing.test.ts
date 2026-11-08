import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRICE_CENTS,
  YAPE_NUMBER,
  accessSummary,
  deriveAccess,
  formatDay,
  formatSoles,
  normalizeBilling,
  validateReference,
} from "./billing.ts";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2025, 11, 1, 12, 0).getTime();

test("el acceso es activo mientras paidUntil no venció", () => {
  assert.equal(deriveAccess({ paidUntil: NOW + DAY, trialEndsAt: NOW + 5 * DAY }, NOW), "active");
});

test("el acceso sigue activo si paidUntil ya venció pero la prueba no", () => {
  assert.equal(deriveAccess({ paidUntil: NOW - DAY, trialEndsAt: NOW + DAY }, NOW), "trial");
});

test("sin fechas vigentes el acceso está vencido", () => {
  assert.equal(deriveAccess({ paidUntil: NOW - DAY, trialEndsAt: NOW - DAY }, NOW), "expired");
  assert.equal(deriveAccess({}, NOW), "expired");
});

test("el borde exacto de vencimiento cuenta como vencido", () => {
  assert.equal(deriveAccess({ paidUntil: NOW }, NOW), "expired");
});

test("el precio se muestra en soles sin decimales de relleno", () => {
  assert.equal(formatSoles(PRICE_CENTS), "S/ 29");
  assert.equal(formatSoles(2950), "S/ 29.50");
});

test("las fechas se muestran en día, mes y año", () => {
  assert.equal(formatDay(new Date(2025, 11, 7).getTime()), "7 dic 2025");
  assert.equal(formatDay(null), "");
});

test("el código de operación debe tener entre 6 y 20 caracteres", () => {
  assert.equal(validateReference("123456"), null);
  assert.equal(validateReference("  123456  "), null);
  assert.equal(validateReference("12345"), "El código tiene al menos 6 caracteres");
  assert.equal(validateReference("1".repeat(21)), "El código tiene como máximo 20 caracteres");
  assert.equal(validateReference("   "), "Ingresa el código de operación");
});

test("la respuesta del API se normaliza al estado de la UI", () => {
  const state = normalizeBilling(
    {
      trialEndsAt: new Date(NOW + 3 * DAY).toISOString(),
      paidUntil: null,
      pendingPayment: { amountCents: 2900, reference: "ABC123", createdAt: NOW },
    },
    NOW,
  );

  assert.equal(state.access, "trial");
  assert.equal(state.trialEndsAt, NOW + 3 * DAY);
  assert.equal(state.paidUntil, null);
  assert.equal(state.priceCents, PRICE_CENTS);
  assert.equal(state.yapeNumber, YAPE_NUMBER);
  assert.equal(state.pendingPayment?.reference, "ABC123");
});

test("sin pago pendiente ni fechas válidas el estado queda vencido", () => {
  const state = normalizeBilling({ access: "expired", pendingPayment: null }, NOW);
  assert.equal(state.access, "expired");
  assert.equal(state.pendingPayment, null);
});

test("el resumen usa el color del tema según el estado", () => {
  const trial = normalizeBilling({ trialEndsAt: NOW + DAY }, NOW);
  assert.equal(accessSummary(trial).tone, "#facc15");

  const active = normalizeBilling({ paidUntil: NOW + DAY }, NOW);
  assert.equal(accessSummary(active).tone, "#4ade80");

  const expired = normalizeBilling({}, NOW);
  assert.equal(accessSummary(expired).label, "Vencido");
  assert.equal(accessSummary(expired).tone, "#fe2c55");
});
