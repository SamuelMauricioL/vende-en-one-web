import { test } from "node:test";
import assert from "node:assert/strict";

import { kitContent, type KitContent } from "./content.ts";
import { DEMO_TEXT } from "./demo-copy.ts";
import { RUBRICS, kitTemplates, splitVariables } from "./templates.ts";

/**
 * S3/S3b de `odd/tasks/kit-live-sin-improvisar.md`: la copia en español no se
 * reescribe, no se resume y no se reordena. Cada cadena tiene que aparecer tal
 * cual en el texto del demo, y cada bloque tiene que conservar sus elementos.
 *
 * `form.status` es la única copia nueva: existe porque el formulario ahora
 * guarda de verdad (S6) y tiene que decir qué pasó cuando el envío falla.
 */

const NEW_COPY = new Set([
  "form.status.submitting",
  "form.status.invalidEmail",
  "form.status.invalidTiktok",
  "form.status.failed",
]);

function leaves(node: unknown, path = ""): Array<{ path: string; value: string }> {
  if (typeof node === "string") return [{ path, value: node }];
  if (Array.isArray(node)) {
    return node.flatMap((item, index) => leaves(item, `${path}[${index}]`));
  }
  if (node && typeof node === "object") {
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
      leaves(value, path ? `${path}.${key}` : key),
    );
  }
  return [];
}

function demoStrings(): Array<{ path: string; value: string }> {
  return leaves(kitContent.es).filter((leaf) => !NEW_COPY.has(leaf.path));
}

test("toda la copia en español aparece palabra por palabra en el demo", () => {
  for (const { path, value } of demoStrings()) {
    assert.ok(
      DEMO_TEXT.includes(value),
      `${path} no está textualmente en el demo: "${value}"`,
    );
  }
});

test("los títulos con degradado se leen completos, como en el demo", () => {
  const composites = [
    `${kitContent.es.hero.title} ${kitContent.es.hero.titleAccent}`,
    `${kitContent.es.liveLeads.warnTitle} ${kitContent.es.liveLeads.warnAccent}`,
    `${kitContent.es.liveLeads.title} ${kitContent.es.liveLeads.titleAccent}`,
    `${kitContent.es.videos.title} ${kitContent.es.videos.titleAccent}`,
    `${kitContent.es.final.title} ${kitContent.es.final.titleAccent}`,
  ];

  for (const phrase of composites) {
    assert.ok(DEMO_TEXT.includes(phrase), `no está en el demo: "${phrase}"`);
  }
});

test("los 13 bloques conservan sus elementos", () => {
  const es = kitContent.es;
  assert.equal(es.hero.chips.length, 3);
  assert.equal(es.toc.items.length, 6);
  assert.equal(es.sections.before.checklist?.items.length, 6);
  assert.equal(es.sections.hook.compare.do.length > 0, true);
  assert.equal(es.sections.offer.checklist?.items.length, 3);
  assert.equal(es.sections.during.checklist?.items.length, 5);
  assert.equal(es.sections.after.checklist?.items.length, 5);
  assert.equal(es.liveLeads.steps.length, 3);
  assert.equal(es.liveLeads.board.rows.length, 3);
  assert.equal(es.videos.items.length, 2);
  assert.equal(es.templates.tabs.length, 4);
  assert.equal(es.faq.items.length, 4);
  assert.equal(es.form.categories.length, 5);
  assert.equal(es.sections.before.checklist?.items.length, 6);
});

test("los 19 puntos de checklist llevan texto", () => {
  const es = kitContent.es;
  const items = [
    ...(es.sections.before.checklist?.items ?? []),
    ...(es.sections.offer.checklist?.items ?? []),
    ...(es.sections.during.checklist?.items ?? []),
    ...(es.sections.after.checklist?.items ?? []),
  ];

  assert.equal(items.length, 19);
  for (const item of items) assert.ok(item.text.trim().length > 10, item.text);
});

test("los 12 mensajes son verbatim y conservan sus variables", () => {
  for (const rubric of RUBRICS) {
    const messages = kitTemplates.es[rubric];
    assert.equal(messages.length, 3, rubric);

    for (const message of messages) {
      assert.ok(
        DEMO_TEXT.includes(message.text),
        `${rubric}/${message.moment} no está textualmente en el demo`,
      );
      assert.ok(
        splitVariables(message.text).some((segment) => segment.isVariable),
        `${rubric}/${message.moment} perdió sus variables`,
      );
    }
  }
});

test("inglés tiene la misma forma que español, sin bloques de menos", () => {
  const shape = (node: KitContent) =>
    leaves(node).map((leaf) => `${leaf.path.replace(/\[\d+\]/g, "[]")}`);

  assert.deepEqual(shape(kitContent.en), shape(kitContent.es));

  for (const rubric of RUBRICS) {
    assert.equal(kitTemplates.en[rubric].length, kitTemplates.es[rubric].length, rubric);
    kitTemplates.en[rubric].forEach((message, index) => {
      assert.ok(message.moment.trim().length > 0, `${rubric}[${index}] sin momento`);
      assert.ok(message.text.trim().length > 20, `${rubric}[${index}] sin texto`);
      assert.ok(
        splitVariables(message.text).some((segment) => segment.isVariable),
        `${rubric}[${index}] perdió sus variables en inglés`,
      );
    });
  }
});

test("splitVariables separa texto y variables sin perder caracteres", () => {
  const text = "Hola {nombre}, soy {tienda}.";
  const segments = splitVariables(text);

  assert.deepEqual(
    segments.map((segment) => segment.value),
    ["Hola ", "{nombre}", ", soy ", "{tienda}", "."],
  );
  assert.equal(
    segments.map((segment) => segment.value).join(""),
    text,
    "el corte no puede perder ni agregar caracteres",
  );
  assert.equal(splitVariables("sin variables").length, 1);
});
