import { test } from "node:test";
import assert from "node:assert/strict";

import { addAccount, parseAccounts, removeAccount } from "./ephemeral-accounts.ts";

test("agregar una cuenta la deja en la lista", () => {
  const result = addAccount([], "mitienda", 1000);
  assert.deepEqual(result, [{ username: "mitienda", addedAt: 1000 }]);
});

test("agregar la misma cuenta dos veces no la duplica", () => {
  const once = addAccount([], "mitienda", 1000);
  const twice = addAccount(once, "mitienda", 2000);
  assert.equal(twice.length, 1);
  assert.deepEqual(twice, once);
});

test("el usuario se normaliza a minúsculas y sin arroba", () => {
  assert.deepEqual(addAccount([], "@MiTienda", 5), [{ username: "mitienda", addedAt: 5 }]);
});

test("un usuario inválido no entra a la lista", () => {
  assert.deepEqual(addAccount([], "   ", 1), []);
  assert.deepEqual(addAccount([], "con espacio", 1), []);
  assert.deepEqual(addAccount([], "@", 1), []);
});

test("quitar una cuenta la elimina y deja el resto", () => {
  const list = addAccount(addAccount([], "uno", 1), "dos", 2);
  assert.deepEqual(removeAccount(list, "uno"), [{ username: "dos", addedAt: 2 }]);
});

test("quitar una cuenta que no está no cambia nada", () => {
  const list = addAccount([], "uno", 1);
  assert.deepEqual(removeAccount(list, "otro"), list);
});

test("un almacenamiento corrupto no rompe la lectura", () => {
  assert.deepEqual(parseAccounts(null), []);
  assert.deepEqual(parseAccounts("no es json"), []);
  assert.deepEqual(parseAccounts('{"a":1}'), []);
  assert.deepEqual(parseAccounts("42"), []);
});

test("la lectura descarta entradas sin usuario utilizable", () => {
  const raw = JSON.stringify([
    { username: "buena", addedAt: 1 },
    { username: "", addedAt: 2 },
    { username: 7, addedAt: 3 },
    { addedAt: 4 },
    "basura",
  ]);
  assert.deepEqual(parseAccounts(raw), [{ username: "buena", addedAt: 1 }]);
});
