import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createFilter,
  deleteFilter,
  fetchFilters,
  groupFiltersByStage,
  leadMessage,
  normalizeFilters,
  updateFilter,
  type FilterView,
  type LeadRow,
} from "./filters-api.ts";

/* ── Stub de fetch ── */

interface Call {
  url: string;
  init: RequestInit | undefined;
}

function stubFetch(reply: (call: Call) => { status?: number; body?: unknown }) {
  const calls: Call[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: Call = { url: String(input), init };
    calls.push(call);
    const { status = 200, body = {} } = reply(call);
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return { calls, restore: () => { globalThis.fetch = original; } };
}

const getToken = async () => "token-de-prueba";

function filter(overrides: Partial<FilterView> = {}): FilterView {
  return {
    source: "store",
    id: "f1",
    name: "PS5",
    keywords: ["PS5"],
    stage: "compra",
    editable: true,
    ...overrides,
  };
}

function lead(overrides: Partial<LeadRow> = {}): LeadRow {
  return {
    tiktokUserId: "u1",
    firstSeen: 1_000,
    comments: 2,
    commentTexts: ["quiero la PS5"],
    stage: "compra",
    stageLabel: "PS5",
    spans: [
      { text: "quiero la ", strong: false },
      { text: "PS5", strong: true },
    ],
    score: 10,
    ...overrides,
  };
}

/* ── Mapeo del contrato ── */

test("normalizeFilters deduplica por nombre normalizado y conserva el primero", () => {
  const list = normalizeFilters([
    filter({ id: "a", name: " Envío " }),
    filter({ id: "b", name: "envío" }),
    filter({ id: "c", name: "PS5" }),
  ]);
  assert.deepEqual(list.map((item) => item.id), ["a", "c"]);
});

test("groupFiltersByStage agrupa por etapa en orden compra → interesado y omite vacías", () => {
  const groups = groupFiltersByStage([
    filter({ id: "i", stage: "interesado" }),
    filter({ id: "c", stage: "compra" }),
  ]);
  assert.deepEqual(groups.map((group) => group.stage), ["compra", "interesado"]);
  assert.deepEqual(groups[0].filters.map((item) => item.id), ["c"]);
});

test("leadMessage usa los spans del servidor y cae al primer comentario", () => {
  assert.equal(leadMessage(lead()), "quiero la PS5");
  assert.equal(
    leadMessage(lead({ spans: [], commentTexts: ["me interesa", "precio?"] })),
    "me interesa",
  );
  assert.equal(leadMessage(lead({ spans: [], commentTexts: [] })), null);
});

/* ── Cliente de filtros ── */

test("fetchFilters pide la tienda con auth y normaliza la respuesta", async (t) => {
  const { calls, restore } = stubFetch(() => ({
    body: {
      filters: [filter({ id: "s1", source: "system", name: "Sistema", editable: false }), filter()],
    },
  }));
  t.after(restore);

  const list = await fetchFilters("store-1", getToken);

  assert.equal(calls[0].url, "/api/stores/store-1/filters");
  assert.equal(calls[0].init?.method, "GET");
  const headers = calls[0].init?.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer token-de-prueba");
  assert.deepEqual(list.map((item) => item.id), ["s1", "f1"]);
});

test("createFilter envía el payload y devuelve el filtro del servidor", async (t) => {
  const created = filter({ id: "nuevo", name: "PlayStation" });
  const { calls, restore } = stubFetch(() => ({ body: { filter: created } }));
  t.after(restore);

  const result = await createFilter("store-1", { name: "PlayStation", keywords: ["PlayStation"] }, getToken);

  assert.equal(result.id, "nuevo");
  assert.equal(calls[0].url, "/api/stores/store-1/filters");
  assert.equal(calls[0].init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    name: "PlayStation",
    keywords: ["PlayStation"],
  });
});

test("updateFilter hace PATCH del id codificado", async (t) => {
  const { calls, restore } = stubFetch(() => ({ body: { filter: filter({ stage: "negociando" }) } }));
  t.after(restore);

  const result = await updateFilter("store-1", "id con espacio", { stage: "negociando" }, getToken);

  assert.equal(result.stage, "negociando");
  assert.equal(calls[0].url, "/api/stores/store-1/filters/id%20con%20espacio");
  assert.equal(calls[0].init?.method, "PATCH");
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { stage: "negociando" });
});

test("deleteFilter hace DELETE y no devuelve cuerpo", async (t) => {
  const { calls, restore } = stubFetch(() => ({ body: { ok: true } }));
  t.after(restore);

  const result = await deleteFilter("store-1", "f1", getToken);

  assert.equal(result, undefined);
  assert.equal(calls[0].url, "/api/stores/store-1/filters/f1");
  assert.equal(calls[0].init?.method, "DELETE");
});

test("un error del servidor viaja con su mensaje y su status", async (t) => {
  const { restore } = stubFetch(() => ({ status: 403, body: { error: "No autorizado" } }));
  t.after(restore);

  await assert.rejects(() => fetchFilters("store-1", getToken), /No autorizado/);

  const second = stubFetch(() => ({ status: 500, body: {} }));
  t.after(second.restore);
  await assert.rejects(() => fetchFilters("store-1", getToken), /500/);
});

test("sin token la petición sigue saliendo, pero sin Authorization", async (t) => {
  const { calls, restore } = stubFetch(() => ({ body: { filters: [] } }));
  t.after(restore);

  await fetchFilters("store-1");

  const headers = calls[0].init?.headers as Record<string, string>;
  assert.equal(headers.Authorization, undefined);
});
