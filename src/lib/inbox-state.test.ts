import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildConversations,
  closedOutcome,
  isUnread,
  liveLabel,
  loadState,
  markSeen,
  setOutcome,
  clearOutcome,
  type InboxSessionInput,
  type InboxState,
} from "./inbox-state.ts";

const STORE = "tutienda";
const ROSA = "uid-rosa";
const LUZ = "uid-luz";

function session(
  id: string,
  endedAt: number,
  chat: Array<[string, string, number]>,
): InboxSessionInput {
  return {
    _id: id,
    username: STORE,
    status: "ended",
    startedAt: endedAt - 3600_000,
    endedAt,
    summary: {
      chat: chat.map(([tiktokUserId, comment, createdAt], i) => ({
        id: `${id}-${i}`,
        tiktokUserId,
        displayId: tiktokUserId,
        comment,
        createdAt,
      })),
    },
  };
}

const LIVE_7 = new Date(2026, 10, 7, 21, 0).getTime();
const LIVE_6 = new Date(2026, 10, 6, 21, 0).getTime();

const sessions: InboxSessionInput[] = [
  session("s7", LIVE_7, [
    [ROSA, "cuanto cuesta?", LIVE_7 + 1_000],
    [LUZ, "me la separas", LIVE_7 + 2_000],
    [ROSA, "precio porfa", LIVE_7 + 3_000],
  ]),
  session("s6", LIVE_6, [[ROSA, "hola", LIVE_6 + 1_000]]),
];

test("agrupa por persona entre lives y cuenta mensajes", () => {
  const list = buildConversations(sessions, STORE, {});
  assert.equal(list.length, 2);
  const rosa = list.find((c) => c.tiktokUserId === ROSA);
  assert.ok(rosa);
  assert.equal(rosa.totalMessages, 3, "suma mensajes de los dos lives");
  assert.equal(rosa.lastMessage, "precio porfa");
  assert.equal(rosa.liveTags.length, 2, "aparece en los dos lives");
});

test("etiqueta del live sale de endedAt", () => {
  assert.equal(liveLabel(LIVE_7), "7 nov");
  assert.equal(liveLabel(LIVE_6), "6 nov");
});

test("sin desenlace, la conversación queda abierta aunque se haya visto", () => {
  let state: InboxState = {};
  state = markSeen(state, STORE, ROSA, LIVE_7 + 10_000);
  const rosa = buildConversations(sessions, STORE, state).find((c) => c.tiktokUserId === ROSA);
  assert.ok(rosa);
  assert.equal(rosa.closed, null, "ver no cierra el bucle");
});

test("los tres desenlaces cierran el bucle", () => {
  for (const outcome of ["contactado", "whatsapp", "ignorado"] as const) {
    const state = setOutcome({}, STORE, ROSA, LIVE_7 + 20_000, outcome);
    const rosa = buildConversations(sessions, STORE, state).find((c) => c.tiktokUserId === ROSA);
    assert.equal(rosa?.closed?.state, outcome);
  }
});

test("un mensaje nuevo después del cierre reabre la conversación", () => {
  const cerrada = setOutcome({}, STORE, ROSA, LIVE_7 + 20_000, "ignorado");
  const posteriores = [
    session("s7", LIVE_7, [[ROSA, "sigo interesada", LIVE_7 + 30_000]]),
  ];
  const rosa = buildConversations(posteriores, STORE, cerrada).find(
    (c) => c.tiktokUserId === ROSA,
  );
  assert.equal(rosa?.closed, null, "el cierre no puede ser un agujero negro");
});

test("no leído se deriva de lastSeenAt", () => {
  const state = markSeen({}, STORE, ROSA, LIVE_7 + 1_500);
  const rosa = buildConversations(sessions, STORE, state).find((c) => c.tiktokUserId === ROSA);
  assert.ok(rosa);
  assert.equal(isUnread(rosa, state[`${STORE}:${ROSA}`]), true, "hay mensajes después de lo visto");
  assert.equal(isUnread(rosa, undefined), true, "nunca abierta = no leída");
});

test("deshacer devuelve la conversación a abierta", () => {
  const state = setOutcome({}, STORE, ROSA, LIVE_7 + 20_000, "ignorado");
  const limpio = clearOutcome(state, STORE, ROSA);
  const rosa = buildConversations(sessions, STORE, limpio).find((c) => c.tiktokUserId === ROSA);
  assert.equal(rosa?.closed, null);
});

test("las abiertas van antes que las cerradas y por último mensaje", () => {
  let state = setOutcome({}, STORE, ROSA, LIVE_7 + 20_000, "contactado");
  const list = buildConversations(sessions, STORE, state);
  assert.equal(list[0].tiktokUserId, LUZ, "la abierta primero aunque sea más antigua");
  assert.equal(list[1].tiktokUserId, ROSA);
});

test("closedOutcome tolera estado vacío", () => {
  assert.equal(closedOutcome(loadState(), STORE, ROSA), null);
});

test("cierra aunque la hora del mensaje esté adelantada respecto al cierre", () => {
  // Reloj desfasado: el último mensaje parece del futuro (23:30) y el cierre ocurre "ahora" (21:05).
  const adelantado = [
    session("s7", LIVE_7, [[ROSA, "precio porfa", LIVE_7 + 9_000_000]]),
  ];
  const conv = buildConversations(adelantado, STORE, {}).find((c) => c.tiktokUserId === ROSA);
  assert.ok(conv);
  const state = setOutcome({}, STORE, ROSA, LIVE_7 + 5_000, "ignorado", {
    through: conv.lastAt,
  });
  const cerrada = buildConversations(adelantado, STORE, state).find((c) => c.tiktokUserId === ROSA);
  assert.equal(cerrada?.closed?.state, "ignorado");
});

test("el cierre cubre hasta el último mensaje visto, no hasta el reloj", () => {
  const state = setOutcome({}, STORE, ROSA, LIVE_7 + 5_000, "contactado", {
    through: LIVE_7 + 3_000,
  });
  const despues = [session("s7", LIVE_7, [[ROSA, "nuevo mensaje", LIVE_7 + 60_000]])];
  const conv = buildConversations(despues, STORE, state).find((c) => c.tiktokUserId === ROSA);
  assert.equal(conv?.closed, null, "un mensaje posterior al cierre lo reabre");
});
