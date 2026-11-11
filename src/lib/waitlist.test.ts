import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CATEGORIES,
  FREQUENCIES,
  buildPayload,
  normalizeTiktok,
  validateWaitlist,
  type WaitlistInput,
} from "./waitlist.ts";

/** S2/S4 de `odd/tasks/waitlist.md`: mismas reglas que el formulario del demo. */

const ok: WaitlistInput = {
  email: "tienda@correo.com",
  store: "Esther Joyería",
  tiktok: "@estherjoyeria",
  category: "Joyería y accesorios",
  frequency: "3 a 5",
};

test("con todos los campos bien no hay error y el @ queda normalizado", () => {
  assert.equal(validateWaitlist(ok), null);
  assert.equal(buildPayload({ ...ok, tiktok: "estherjoyeria" }).tiktok, "@estherjoyeria");
  assert.equal(buildPayload({ ...ok, tiktok: "  @estherjoyeria " }).tiktok, "@estherjoyeria");
});

test("correo inválido o vacío rechaza", () => {
  for (const email of ["", "sin-arroba", "a@b", "a@b.", "@correo.com"]) {
    assert.equal(validateWaitlist({ ...ok, email }), "invalid", `debería rechazar "${email}"`);
  }
});

test("tienda vacía rechaza", () => {
  assert.equal(validateWaitlist({ ...ok, store: "" }), "invalid");
  assert.equal(validateWaitlist({ ...ok, store: "   " }), "invalid");
});

test("usuario de TikTok demasiado corto o con caracteres raros rechaza", () => {
  for (const tiktok of ["", "@", "@a", "con espacio", "acentué", "@" + "a".repeat(25)]) {
    assert.equal(validateWaitlist({ ...ok, tiktok }), "invalid", `debería rechazar "${tiktok}"`);
  }
});

test("categoría o frecuencia fuera de la lista rechaza", () => {
  assert.equal(validateWaitlist({ ...ok, category: "" }), "invalid");
  assert.equal(validateWaitlist({ ...ok, category: "Otra cosa" }), "invalid");
  assert.equal(validateWaitlist({ ...ok, frequency: "" }), "invalid");
  assert.equal(validateWaitlist({ ...ok, frequency: "todos los días" }), "invalid");
});

test("todas las opciones de las listas cerradas son válidas", () => {
  for (const category of CATEGORIES) {
    assert.equal(validateWaitlist({ ...ok, category }), null, category);
  }
  for (const frequency of FREQUENCIES) {
    assert.equal(validateWaitlist({ ...ok, frequency }), null, frequency);
  }
});

test("el honeypot viaja en el payload y no se recorta del envío", () => {
  assert.equal(buildPayload(ok).website, "");
  assert.equal(buildPayload({ ...ok, website: "spam" }).website, "spam");
});

test("normalizeTiktok no duplica la arroba", () => {
  assert.equal(normalizeTiktok("@nick"), "@nick");
  assert.equal(normalizeTiktok("nick"), "@nick");
  assert.equal(normalizeTiktok(" @@nick "), "@nick");
});
