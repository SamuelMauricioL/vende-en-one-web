import { test } from "node:test";
import assert from "node:assert/strict";

import {
  getLocale,
  readStoredLocale,
  setLocale,
  subscribe,
} from "./locale-store.ts";

/** S17 de `odd/tasks/kit-live-sin-improvisar.md`: un idioma para todas las islas. */

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

test("sin nada guardado el idioma es español", () => {
  setLocale("es", null);
  assert.equal(getLocale(), "es");
  assert.equal(readStoredLocale(fakeStorage()), null);
});

test("cambiar el idioma avisa a todos los suscriptores una vez", () => {
  setLocale("es", fakeStorage());
  let calls = 0;
  const off = subscribe(() => {
    calls++;
  });

  setLocale("en", fakeStorage());
  assert.equal(getLocale(), "en");
  assert.equal(calls, 1);

  off();
  setLocale("es", fakeStorage());
  assert.equal(calls, 1, "después de desuscribirse ya no se lo avisa");
});

test("el idioma se persiste y se recupera", () => {
  const storage = fakeStorage();
  setLocale("en", storage);
  assert.equal(storage.data["ll-locale"], "en");
  assert.equal(readStoredLocale(storage), "en");
  setLocale("es", null);
});

test("un valor guardado que no es un idioma se ignora", () => {
  assert.equal(readStoredLocale(fakeStorage({ "ll-locale": "fr" })), null);
  assert.equal(readStoredLocale(fakeStorage({ "ll-locale": "" })), null);
});

test("si el almacenamiento está bloqueado el cambio vale para la sesión", () => {
  const broken = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };

  assert.equal(readStoredLocale(broken), null);
  assert.doesNotThrow(() => setLocale("en", broken));
  assert.equal(getLocale(), "en");
  setLocale("es", null);
});
