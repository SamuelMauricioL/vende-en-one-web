import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CATEGORIES,
  LEAD_MAGNET_ENDPOINT,
  buildPayload,
  normalizeTiktok,
  submitLeadMagnet,
  validateLeadMagnet,
} from "./lead-magnet.ts";

/** S5/S6 de `odd/tasks/kit-live-sin-improvisar.md`: reglas del formulario del kit. */

const ok = { email: "tienda@correo.com", tiktok: "@estherjoyeria", category: "Ropa" };

function responder(status: number) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const doFetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return { ok: status >= 200 && status < 300, status } as Response;
  }) as unknown as typeof fetch;
  return { calls, doFetch };
}

test("con correo válido y rubro de la lista no hay error", () => {
  assert.equal(validateLeadMagnet(ok), null);
});

test("correo inválido rechaza", () => {
  for (const email of ["", "sin-arroba", "a@b", "a@b.", "@correo.com"]) {
    assert.equal(validateLeadMagnet({ ...ok, email }), "invalid", `debería rechazar "${email}"`);
  }
});

test("el @ es opcional, pero si llega tiene que tener forma válida", () => {
  assert.equal(validateLeadMagnet({ ...ok, tiktok: "" }), null);
  assert.equal(validateLeadMagnet({ ...ok, tiktok: "   " }), null);
  // Un "@" solo es lo mismo que no escribir nada: se normaliza a vacío.
  assert.equal(validateLeadMagnet({ ...ok, tiktok: "@" }), null);
  assert.equal(buildPayload({ ...ok, tiktok: "@" }).tiktok, "");
  for (const tiktok of ["@a", "con espacio", "acentué", "@" + "a".repeat(25)]) {
    assert.equal(validateLeadMagnet({ ...ok, tiktok }), "invalid", `debería rechazar "${tiktok}"`);
  }
});

test("rubro fuera de la lista rechaza y todas las opciones válidas pasan", () => {
  assert.equal(validateLeadMagnet({ ...ok, category: "" }), "invalid");
  assert.equal(validateLeadMagnet({ ...ok, category: "Otra cosa" }), "invalid");
  for (const category of CATEGORIES) {
    assert.equal(validateLeadMagnet({ ...ok, category }), null, category);
  }
});

test("normalizar el @ no agrega arrobas de más", () => {
  assert.equal(normalizeTiktok("estherjoyeria"), "@estherjoyeria");
  assert.equal(normalizeTiktok("  @@estherjoyeria "), "@estherjoyeria");
  assert.equal(normalizeTiktok(""), "");
});

test("el honeypot viaja en el payload", () => {
  assert.equal(buildPayload({ ...ok, website: "http://bot" }).website, "http://bot");
  assert.equal(buildPayload(ok).website, "");
});

test("el envío va al API propio con JSON y sin no-cors", async () => {
  const { calls, doFetch } = responder(201);
  await submitLeadMagnet(buildPayload(ok), doFetch);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, LEAD_MAGNET_ENDPOINT);
  assert.equal(calls[0].init?.method, "POST");
  assert.equal((calls[0].init?.headers as Record<string, string>)["Content-Type"], "application/json");
  assert.equal(calls[0].init?.mode, undefined);
});

test("un 400 o un 429 dejan el kit bloqueado", async () => {
  for (const status of [400, 429]) {
    const { doFetch } = responder(status);
    await assert.rejects(() => submitLeadMagnet(buildPayload(ok), doFetch), `status ${status}`);
  }
});

test("un fallo de red también rechaza", async () => {
  const doFetch = (async () => {
    throw new TypeError("network down");
  }) as unknown as typeof fetch;
  await assert.rejects(() => submitLeadMagnet(buildPayload(ok), doFetch));
});
