import { test } from "node:test";
import assert from "node:assert/strict";
import {
  groupThread,
  isClosed,
  isUnread,
  liveFilters,
  liveLabel,
  mapConversations,
  pickActiveStore,
  pendingTotal,
  type InboxLead,
  type InboxRow,
} from "./inbox-api.ts";

const LIVE_7 = new Date(2026, 10, 7, 21, 0).getTime();
const LIVE_6 = new Date(2026, 10, 6, 21, 0).getTime();

const rows: InboxRow[] = [
  {
    tiktokUserId: "u-rosa",
    displayId: "rosa.ejemplo",
    totalMessages: 3,
    lastText: "precio porfa",
    lastAt: LIVE_7 + 3_000,
    sessions: {
      s7: { count: 2, endedAt: LIVE_7 },
      s6: { count: 1, endedAt: LIVE_6 },
    },
  },
  {
    tiktokUserId: "u-luz",
    displayId: "luz.ejemplo",
    totalMessages: 1,
    lastText: "reservame la B12",
    lastAt: LIVE_7 + 2_000,
    sessions: { s7: { count: 1, endedAt: LIVE_7 } },
  },
];

test("mapea el agregado del API a conversaciones con su etiqueta de live", () => {
  const list = mapConversations(rows, []);
  assert.equal(list.length, 2);
  const rosa = list.find((c) => c.tiktokUserId === "u-rosa");
  assert.ok(rosa);
  assert.equal(rosa.name, "rosa.ejemplo");
  assert.equal(rosa.totalMessages, 3);
  assert.deepEqual(
    rosa.liveTags.map((t) => t.label),
    ["7 nov", "6 nov"],
  );
});

test("sin desenlace la conversación queda abierta y sin leer", () => {
  const list = mapConversations(rows, []);
  assert.equal(list[0].closed, null);
  assert.equal(list[0].unread, true);
});

test("los tres desenlaces cierran el bucle", () => {
  for (const state of ["contactado", "whatsapp", "ignorado"] as const) {
    const lead: InboxLead = {
      tiktokUserId: "u-rosa",
      state,
      closedAt: LIVE_7 + 10_000,
      closedThrough: LIVE_7 + 3_000,
      lastSeenAt: LIVE_7 + 10_000,
    };
    const rosa = mapConversations(rows, [lead]).find((c) => c.tiktokUserId === "u-rosa");
    assert.equal(rosa?.closed?.state, state);
    assert.equal(rosa?.unread, false, "cerrado y visto no está sin leer");
  }
});

test("un mensaje posterior al cierre reabre la conversación", () => {
  const lead: InboxLead = {
    tiktokUserId: "u-rosa",
    state: "ignorado",
    closedAt: LIVE_7 + 10_000,
    closedThrough: LIVE_7 + 1_000,
    lastSeenAt: LIVE_7 + 10_000,
  };
  const rosa = mapConversations(rows, [lead]).find((c) => c.tiktokUserId === "u-rosa");
  assert.equal(rosa?.closed, null);
  assert.equal(isClosed(lead, LIVE_7 + 5_000), false);
});

test("cierra aunque el reloj del mensaje venga adelantado respecto al cierre", () => {
  const lead: InboxLead = {
    tiktokUserId: "u-futuro",
    state: "contactado",
    closedAt: LIVE_7 + 1_000,
    closedThrough: LIVE_7 + 9_000_000,
    lastSeenAt: LIVE_7 + 1_000,
  };
  assert.equal(isClosed(lead, LIVE_7 + 9_000_000), true);
});

test("las abiertas van antes que las cerradas y por último mensaje", () => {
  const lead: InboxLead = {
    tiktokUserId: "u-rosa",
    state: "contactado",
    closedAt: LIVE_7 + 10_000,
    closedThrough: LIVE_7 + 3_000,
    lastSeenAt: LIVE_7 + 10_000,
  };
  const list = mapConversations(rows, [lead]);
  assert.equal(list[0].tiktokUserId, "u-luz", "la abierta primero");
  assert.equal(list[1].tiktokUserId, "u-rosa");
});

test("los chips por live cuentan solo las pendientes", () => {
  const abiertas = liveFilters(mapConversations(rows, []));
  assert.deepEqual(
    abiertas.map((l) => [l.label, l.pending]),
    [
      ["7 nov", 2],
      ["6 nov", 1],
    ],
  );

  const lead: InboxLead = {
    tiktokUserId: "u-rosa",
    state: "contactado",
    closedAt: LIVE_7 + 10_000,
    closedThrough: LIVE_7 + 3_000,
    lastSeenAt: LIVE_7 + 10_000,
  };
  const cerradaRosa = liveFilters(mapConversations(rows, [lead]));
  assert.deepEqual(
    cerradaRosa.map((l) => [l.label, l.pending]),
    [
      ["7 nov", 1],
      ["6 nov", 0],
    ],
  );
  assert.equal(pendingTotal(mapConversations(rows, [lead])), 1);
});

test("no leído depende de lastSeenAt", () => {
  assert.equal(isUnread(100, undefined), true);
  assert.equal(isUnread(100, { lastSeenAt: 50 } as InboxLead), true);
  assert.equal(isUnread(100, { lastSeenAt: 150 } as InboxLead), false);
});

test("el hilo se agrupa por día con separador", () => {
  const groups = groupThread([
    { sessionId: "s6", text: "hola", createdAt: LIVE_6 + 1_000 },
    { sessionId: "s7", text: "precio", createdAt: LIVE_7 + 1_000 },
    { sessionId: "s7", text: "porfa", createdAt: LIVE_7 + 2_000 },
  ]);
  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups.map((g) => [g.label, g.items.length]),
    [
      ["6 nov", 1],
      ["7 nov", 2],
    ],
  );
});

test("etiqueta de fecha legible", () => {
  assert.equal(liveLabel(LIVE_7), "7 nov");
});

const stores = [
  { _id: "s-vieja", tiktokUsername: "tienda.vieja" },
  { _id: "s-nueva", tiktokUsername: "cevichero.purito.mar" },
];

test("la tienda activa es la del @ del perfil, no la primera", () => {
  // El bug: se tomaba stores[0] y seguía mostrando la cuenta anterior.
  assert.equal(pickActiveStore(stores, "cevichero.purito.mar")?._id, "s-nueva");
  assert.equal(pickActiveStore(stores, "@cevichero.purito.mar")?._id, "s-nueva");
});

test("sin coincidencia con el perfil, usa la última tienda abierta", () => {
  assert.equal(pickActiveStore(stores, "otra.cuenta", "s-nueva")?._id, "s-nueva");
  assert.equal(pickActiveStore(stores, undefined, "s-vieja")?._id, "s-vieja");
});

test("sin perfil ni guardada, cae en la primera", () => {
  assert.equal(pickActiveStore(stores, undefined, null)?._id, "s-vieja");
  assert.equal(pickActiveStore([], "x", "y"), null);
});
