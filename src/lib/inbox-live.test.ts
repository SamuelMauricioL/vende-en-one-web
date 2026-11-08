import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { liveBand, mergeLiveRows } from "./inbox-live.ts";
import type { Conversation } from "./inbox-api.ts";
import type { LeadRow, Totals } from "./filters-api.ts";

const TOTALS: Totals = {
  commented: 9,
  qualified: 4,
  byStage: { compra: 1, negociando: 1, interesado: 2 },
};

const lead = (over: Partial<LeadRow> = {}): LeadRow => ({
  tiktokUserId: "u-rosa",
  displayId: "rosa.ejemplo",
  firstSeen: 1_700_000_000_000,
  comments: 2,
  commentTexts: ["precio porfa"],
  stage: "compra",
  stageLabel: "Precio",
  spans: [],
  score: 10,
  ...over,
});

const conversation = (over: Partial<Conversation> = {}): Conversation => ({
  key: "store-1:u-rosa",
  tiktokUserId: "u-rosa",
  storeId: "store-1",
  storeLabel: "@tienda",
  name: "rosa.ejemplo",
  totalMessages: 2,
  lastText: "hola",
  lastAt: 1_600_000_000_000,
  liveTags: [],
  closed: null,
  unread: false,
  ...over,
});

/* ── Bloque "EN VIVO" (S9) ── */

test("sin live el bloque no existe", () => {
  for (const phase of ["idle", "ended"] as const) {
    const band = liveBand({ phase, connected: true, totals: TOTALS, storeLabel: "tienda" });
    assert.equal(band.visible, false);
    assert.equal(band.phase, "hidden");
    assert.equal(band.label, "");
    assert.equal(band.countLabel, "");
  }
});

test("antes del primer frame el bloque dice conectando", () => {
  const band = liveBand({ phase: null, connected: false, totals: null, storeLabel: "tienda" });
  assert.equal(band.visible, true);
  assert.equal(band.phase, "connecting");
  assert.equal(band.tone, "pending");
  assert.equal(band.label, "Conectando al live…");
  assert.equal(band.countLabel, "");
});

test("en vivo muestra la tienda y el contador de intención", () => {
  const band = liveBand({ phase: "live", connected: true, totals: TOTALS, storeLabel: "@tienda" });
  assert.equal(band.visible, true);
  assert.equal(band.phase, "live");
  assert.equal(band.tone, "live");
  assert.equal(band.label, "🔴 EN VIVO · @tienda");
  assert.equal(band.count, 4);
  assert.equal(band.countLabel, "4 con intención");
});

test("en vivo sin totals todavía cuenta cero", () => {
  const band = liveBand({ phase: "live", connected: true, totals: null, storeLabel: "tienda" });
  assert.equal(band.count, 0);
  assert.equal(band.countLabel, "0 con intención");
});

test("el stream cortado se avisa en ámbar", () => {
  const band = liveBand({ phase: "live", connected: false, totals: TOTALS, storeLabel: "tienda" });
  assert.equal(band.visible, true);
  assert.equal(band.phase, "offline");
  assert.equal(band.tone, "warning");
  assert.equal(band.label, "Sin conexión al live, reintentando");
});

test("el contador se anuncia con la etiqueta de aria-live", () => {
  const band = liveBand({ phase: "live", connected: true, totals: TOTALS, storeLabel: "tienda" });
  assert.match(band.countLabel, /con intención$/);
});

/* ── Filas que llegan por el stream (S9/S10) ── */

test("una fila nueva entra a la lista y se marca para el destello", () => {
  const { conversations, freshKeys } = mergeLiveRows(
    [conversation()],
    [lead({ tiktokUserId: "u-luz", displayId: "luz.ejemplo", outcome: "contactado" })],
    { storeId: "store-1", storeLabel: "@tienda" },
  );
  assert.equal(conversations.length, 2);
  assert.deepEqual(freshKeys, ["store-1:u-luz"]);
  const luz = conversations[0];
  assert.equal(luz.key, "store-1:u-luz");
  assert.equal(luz.name, "luz.ejemplo");
  assert.equal(luz.outcome, "contactado");
});

test("una fila conocida se actualiza sin destello", () => {
  const { conversations, freshKeys } = mergeLiveRows(
    [conversation()],
    [lead({ comments: 5, spans: [{ text: "precio", strong: true }], outcome: "whatsapp" })],
    { storeId: "store-1", storeLabel: "@tienda" },
  );
  assert.equal(conversations.length, 1);
  assert.deepEqual(freshKeys, []);
  assert.equal(conversations[0].totalMessages, 5);
  assert.equal(conversations[0].lastText, "precio");
  assert.equal(conversations[0].outcome, "whatsapp");
});

test("sin desenlace la fila no lleva marca de estado", () => {
  const { conversations } = mergeLiveRows([], [lead({ outcome: null })], {
    storeId: "store-1",
    storeLabel: "@tienda",
  });
  assert.equal(conversations[0].outcome, null);
});

test("un desenlace desconocido no se pinta", () => {
  const { conversations } = mergeLiveRows(
    [],
    [lead({ outcome: "inventado" as unknown as LeadRow["outcome"] })],
    { storeId: "store-1", storeLabel: "@tienda" },
  );
  assert.equal(conversations[0].outcome, null);
});

/* ── S10: el navegador no guarda atendidos ── */

test("no queda ninguna referencia a attended_ en el código", () => {
  const root = new URL("..", import.meta.url).pathname;
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts")) {
        if (readFileSync(full, "utf8").includes("attended_")) {
          offenders.push(relative(root, full));
        }
      }
    }
  };
  walk(root);
  assert.deepEqual(offenders, []);
});
