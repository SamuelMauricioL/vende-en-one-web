import { test } from "node:test";
import assert from "node:assert/strict";

import { COPY_FEEDBACK_MS, copyOutcome, type CopyLabels } from "./contact.ts";
import { waitlistContent } from "./content.ts";

const labels: CopyLabels = { copied: "Copiado", copyFallback: "Selecciona y copia" };

test("copiar con éxito muestra «Copiado»", () => {
  assert.equal(copyOutcome(true, labels), "Copiado");
});

test("si el portapapeles falla, el botón pide seleccionar y copiar", () => {
  assert.equal(copyOutcome(false, labels), "Selecciona y copia");
});

test("el botón se queda así 1,8 s", () => {
  assert.equal(COPY_FEEDBACK_MS, 1800);
});

test("las 3 filas de contacto: copiar o abrir el chat de WhatsApp", () => {
  const rows = waitlistContent.es.contact.rows;

  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((row) => row.action),
    ["copy", "link", "copy"],
  );
  // Las filas de copiar escriben el valor completo tal como se ve.
  assert.deepEqual(
    rows.filter((row) => row.action === "copy").map((row) => row.value),
    ["tiktoklive.leads@gmail.com", "+51 914 895 330"],
  );
  assert.equal(rows[1].href, "https://wa.me/51934000821");
});
