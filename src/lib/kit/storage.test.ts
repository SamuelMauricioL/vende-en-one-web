import { test } from "node:test";
import assert from "node:assert/strict";

import {
  KIT_STORAGE_KEY,
  countChecked,
  readKitState,
  writeKitState,
} from "./storage.ts";

/** S9/S10 de `odd/tasks/kit-live-sin-improvisar.md`: avance y desbloqueo guardados. */

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

test("sin nada guardado el kit arranca bloqueado y sin marcas", () => {
  assert.deepEqual(readKitState(fakeStorage()), { checks: {}, unlocked: false });
});

test("el avance y el desbloqueo sobreviven a la recarga", () => {
  const storage = fakeStorage();
  writeKitState({ checks: { a: [true, false, true] }, unlocked: true }, storage);

  const restored = readKitState(storage);
  assert.deepEqual(restored.checks.a, [true, false, true]);
  assert.equal(restored.unlocked, true);
  assert.ok(storage.data[KIT_STORAGE_KEY].includes("\"unlocked\":true"));
});

test("usa la clave del demo para no pedir el correo dos veces", () => {
  assert.equal(KIT_STORAGE_KEY, "ll-kit-v1");
});

test("un valor corrupto no rompe la página", () => {
  assert.deepEqual(readKitState(fakeStorage({ "ll-kit-v1": "no es json" })), {
    checks: {},
    unlocked: false,
  });
  assert.deepEqual(readKitState(fakeStorage({ "ll-kit-v1": "[1,2,3]" })), {
    checks: {},
    unlocked: false,
  });
});

test("si el almacenamiento está bloqueado leer y escribir no lanzan", () => {
  const broken = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };

  assert.deepEqual(readKitState(broken), { checks: {}, unlocked: false });
  assert.doesNotThrow(() => writeKitState({ checks: {}, unlocked: true }, broken));
});

test("el contador cuenta solo lo marcado", () => {
  assert.equal(countChecked([false, false]), 0);
  assert.equal(countChecked([true, false, true]), 2);
  assert.equal(countChecked([]), 0);
});
