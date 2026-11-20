import { test } from "node:test";
import assert from "node:assert/strict";

import { menuItems } from "./menu.ts";

const ids = (input: Parameters<typeof menuItems>[0]) => menuItems(input).map((item) => item.id);

test("un admin sin tienda ve las tres areas, la entrada temporal de perfil y ninguna entrada de vendedor", () => {
  const items = menuItems({
    isAdmin: true,
    hasStore: false,
    acting: false,
    counts: { payments: 0, leads: 9, accounts: 13 },
  });

  assert.deepEqual(items.map((item) => item.id), [
    "admin.payments",
    "admin.leads",
    "admin.accounts",
    "admin.perfil",
    "profile",
  ]);
  assert.deepEqual(items.filter((item) => item.kind === "seller"), []);
});

test("los contadores llegan al area que corresponde y el cero no se pierde", () => {
  const items = menuItems({
    isAdmin: true,
    hasStore: false,
    acting: false,
    counts: { payments: 0, leads: 9, accounts: 13 },
  });
  const byId = new Map(items.map((item) => [item.id, item]));

  assert.equal(byId.get("admin.payments")?.count, 0);
  assert.equal(byId.get("admin.leads")?.count, 9);
  assert.equal(byId.get("admin.accounts")?.count, 13);
});

test("sin contadores el area sigue visible y sin numero", () => {
  const items = menuItems({ isAdmin: true, hasStore: false, acting: false, counts: null });
  const payments = items.find((item) => item.id === "admin.payments");

  assert.ok(payments);
  assert.equal(payments.count, undefined);
});

test("un vendedor con tienda ve sus cuatro entradas y ninguna de admin", () => {
  assert.deepEqual(ids({ isAdmin: false, hasStore: true, acting: false, counts: { payments: 3, leads: 4, accounts: 5 } }), [
    "live",
    "inbox",
    "filters",
    "billing",
    "profile",
  ]);
});

test("un admin actuando como cliente ve la superficie del cliente, no la suya", () => {
  const items = ids({ isAdmin: true, hasStore: false, acting: true, counts: { payments: 0, leads: 9, accounts: 13 } });

  assert.deepEqual(items, ["live", "inbox", "filters", "billing", "profile"]);
});

test("un seller sin tienda y sin actuacion no ve entradas que solo llevan a un aviso", () => {
  assert.deepEqual(ids({ isAdmin: false, hasStore: false, acting: false, counts: null }), ["profile"]);
});

test("perfil cierra la lista en todos los casos", () => {
  const cases = [
    { isAdmin: true, hasStore: false, acting: false, counts: null },
    { isAdmin: false, hasStore: true, acting: false, counts: null },
    { isAdmin: true, hasStore: true, acting: false, counts: { payments: 1, leads: 1, accounts: 1 } },
  ];

  for (const input of cases) {
    const items = menuItems(input);
    assert.equal(items[items.length - 1]?.id, "profile");
  }
});

test("quien tiene tienda y ademas es admin ve primero su trabajo y luego la administracion", () => {
  const items = ids({ isAdmin: true, hasStore: true, acting: false, counts: { payments: 1, leads: 2, accounts: 3 } });

  assert.deepEqual(items, [
    "live",
    "inbox",
    "filters",
    "billing",
    "admin.payments",
    "admin.leads",
    "admin.accounts",
    "admin.perfil",
    "profile",
  ]);
});

test("las areas del admin apuntan a rutas propias y enlazables", () => {
  const items = menuItems({ isAdmin: true, hasStore: false, acting: false, counts: null });
  const hrefs = items.filter((item) => item.kind === "admin").map((item) => item.href);

  assert.deepEqual(hrefs, ["/app/admin/pagos", "/app/admin/leads", "/app/admin/cuentas", "/perfil"]);
});
