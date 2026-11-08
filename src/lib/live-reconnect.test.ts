import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EVENT_SOURCE_CLOSED,
  EVENT_SOURCE_CONNECTING,
  MAX_STREAM_RETRIES,
  decideLiveReconnect,
  formatSavedLive,
  isDeadSessionStatus,
  parseSavedLive,
  shouldRetryStream,
} from "./live-reconnect.ts";

const liveBody = (status: string, sessionId: string | null) => ({
  live: { username: "tienda", status, sessionId },
});

test("reengancha cuando el servidor ya tiene una sesión viva", () => {
  for (const status of ["live", "connecting"]) {
    const decision = decideLiveReconnect({
      httpStatus: 200,
      body: liveBody(status, "sess-1"),
      monitorSaysLive: false,
    });
    assert.deepEqual(decision, { kind: "reconnect", sessionId: "sess-1" });
  }
});

test("no arranca una sesión nueva si ya hay una viva", () => {
  const decision = decideLiveReconnect({
    httpStatus: 200,
    body: liveBody("live", "sess-1"),
    monitorSaysLive: true,
  });
  assert.equal(decision.kind, "reconnect");
});

test("una sesión terminada no se reusa", () => {
  for (const status of ["ended", "error", "stopped"]) {
    assert.deepEqual(
      decideLiveReconnect({ httpStatus: 200, body: liveBody(status, "sess-1") }),
      { kind: "idle" },
    );
  }
});

test("una sesión viva sin sessionId no sirve para engancharse", () => {
  const decision = decideLiveReconnect({
    httpStatus: 200,
    body: liveBody("live", null),
    monitorSaysLive: false,
  });
  assert.deepEqual(decision, { kind: "idle" });
});

test("404 sin monitor en vivo deja la pantalla quieta", () => {
  const decision = decideLiveReconnect({ httpStatus: 404, body: { error: "not found" } });
  assert.deepEqual(decision, { kind: "idle" });
});

test("404 con el monitor en vivo arranca el live", () => {
  const decision = decideLiveReconnect({
    httpStatus: 404,
    body: { error: "not found" },
    monitorSaysLive: true,
  });
  assert.deepEqual(decision, { kind: "start" });
});

test("403 por @ ajeno no rompe la pantalla", () => {
  const decision = decideLiveReconnect({
    httpStatus: 403,
    body: { error: "Forbidden", message: "Ese @ no pertenece a tu cuenta" },
  });
  assert.deepEqual(decision, {
    kind: "forbidden",
    message: "Ese @ no pertenece a tu cuenta",
  });
});

test("403 sin mensaje del API usa uno propio", () => {
  const decision = decideLiveReconnect({ httpStatus: 403, body: null });
  assert.equal(decision.kind, "forbidden");
  assert.ok(decision.kind === "forbidden" && decision.message.length > 0);
});

test("un error del API no dispara ni reenganche ni arranque", () => {
  for (const httpStatus of [0, 401, 500, 503]) {
    assert.deepEqual(decideLiveReconnect({ httpStatus, body: null, monitorSaysLive: false }), {
      kind: "idle",
    });
  }
});

test("guarda y lee el handle del live con su sessionId", () => {
  const raw = formatSavedLive({ username: "tienda", sessionId: "sess-9" });
  assert.deepEqual(parseSavedLive(raw), { username: "tienda", sessionId: "sess-9" });
  assert.deepEqual(parseSavedLive(raw), { username: "tienda", sessionId: "sess-9" });
});

test("lee el formato viejo, que guardaba solo el @", () => {
  assert.deepEqual(parseSavedLive("tienda"), { username: "tienda", sessionId: null });
  assert.deepEqual(parseSavedLive("@tienda"), { username: "tienda", sessionId: null });
});

test("sin handle guardado o con basura devuelve null", () => {
  for (const raw of [null, "", "   ", "{}", '{"username":""}', "[1,2]"]) {
    assert.equal(parseSavedLive(raw), null);
  }
});

test("401, 403 y 404 marcan la sesión como muerta", () => {
  for (const status of [401, 403, 404]) assert.equal(isDeadSessionStatus(status), true);
  for (const status of [0, 200, 500, 503]) assert.equal(isDeadSessionStatus(status), false);
});

test("el reintento se corta cuando la sesión está muerta", () => {
  for (const ticketStatus of [401, 404]) {
    assert.equal(
      shouldRetryStream({ ticketStatus, readyState: EVENT_SOURCE_CONNECTING, retries: 0 }),
      false,
    );
  }
});

test("reintenta un corte de red mientras queden intentos", () => {
  assert.equal(
    shouldRetryStream({ ticketStatus: 200, readyState: EVENT_SOURCE_CONNECTING, retries: 0 }),
    true,
  );
  assert.equal(
    shouldRetryStream({
      ticketStatus: 200,
      readyState: EVENT_SOURCE_CONNECTING,
      retries: MAX_STREAM_RETRIES - 1,
    }),
    true,
  );
  assert.equal(
    shouldRetryStream({
      ticketStatus: 200,
      readyState: EVENT_SOURCE_CONNECTING,
      retries: MAX_STREAM_RETRIES,
    }),
    false,
  );
});

test("un rechazo del stream con ticket fresco se reintenta una sola vez", () => {
  assert.equal(
    shouldRetryStream({ ticketStatus: 200, readyState: EVENT_SOURCE_CLOSED, retries: 0 }),
    true,
  );
  assert.equal(
    shouldRetryStream({ ticketStatus: 200, readyState: EVENT_SOURCE_CLOSED, retries: 1 }),
    false,
  );
});
