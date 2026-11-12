import { test } from "node:test";
import assert from "node:assert/strict";

import { waitlistContent, type WaitlistLandingContent } from "./content.ts";
import { DEMO_TEXT } from "./demo-copy.ts";

/**
 * S3 de `odd/tasks/landing-waitlist.md`: la copia en español no se reescribe,
 * no se resume y no se reordena. Cada cadena tiene que aparecer tal cual en el
 * texto del demo (`demo-copy.ts`), y cada bloque tiene que conservar sus
 * elementos. El inglés es traducción, no otra estructura.
 */

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

/** Enlaces, rutas de imágenes y tipo de acción no son copia: no se comparan. */
const STRUCTURAL = [".href", ".src", ".action"];

/** Todas las cadenas del español aparecen en el demo, sin excepciones. */
test("cada cadena de content.es aparece verbatim en el texto del demo", () => {
  const missing = leaves(waitlistContent.es)
    .filter((leaf) => leaf.value.trim().length > 0)
    .filter((leaf) => !STRUCTURAL.some((suffix) => leaf.path.endsWith(suffix)))
    .filter((leaf) => !DEMO_TEXT.includes(leaf.value))
    .map((leaf) => `${leaf.path}: ${leaf.value}`);

  assert.deepEqual(missing, []);
});

/** Los conteos cerrados de S3: sin esto, reordenar o perder un ítem pasa. */
test("cada bloque conserva su número de elementos", () => {
  const es = waitlistContent.es;

  assert.equal(es.product.slides.length, 3);
  assert.equal(es.steps.items.length, 3);
  assert.equal(es.tiktok.perms.length, 4);
  assert.equal(es.faq.items.length, 6);
  assert.equal(es.contact.rows.length, 3);
  assert.equal(Object.keys(es.waitlist.fields).length, 5);
});

/** El inglés no comparte el contenido, pero sí la forma: misma estructura. */
test("es y en tienen la misma forma", () => {
  const shape = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(shape);
    if (node && typeof node === "object") {
      return Object.fromEntries(
        Object.entries(node as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => [key, shape(value)]),
      );
    }
    return typeof node;
  };

  assert.deepEqual(shape(waitlistContent.en), shape(waitlistContent.es));
});

/** Las 4 anclas del demo apuntan a secciones que la página compone. */
test("las anclas del demo están las 4 y en orden", () => {
  const anchors = waitlistContent.es.anchors.map((anchor) => anchor.href);
  assert.deepEqual(anchors, ["#demo", "#como", "#faq", "#waitlist"]);

  const content: WaitlistLandingContent = waitlistContent.es;
  assert.equal(content.footer.links.length, 2);
});
