

export const KIT_STORAGE_KEY = "ll-kit-v1";

export interface KitState {

  checks: Record<string, boolean[]>;
  unlocked: boolean;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const EMPTY: KitState = { checks: {}, unlocked: false };

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readKitState(storage?: StorageLike | null): KitState {
  const target = resolveStorage(storage);
  try {
    const raw = target?.getItem(KIT_STORAGE_KEY);
    if (!raw) return { ...EMPTY, checks: {} };
    const parsed = JSON.parse(raw) as Partial<KitState>;
    return {
      checks: parsed.checks && typeof parsed.checks === "object" ? parsed.checks : {},
      unlocked: parsed.unlocked === true,
    };
  } catch {
    return { ...EMPTY, checks: {} };
  }
}

export function writeKitState(state: KitState, storage?: StorageLike | null): void {
  const target = resolveStorage(storage);
  try {
    target?.setItem(KIT_STORAGE_KEY, JSON.stringify(state));
  } catch {

  }
}

export function countChecked(values: boolean[]): number {
  return values.filter(Boolean).length;
}
