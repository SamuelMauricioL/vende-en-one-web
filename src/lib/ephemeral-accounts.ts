export type EphemeralAccount = { username: string; addedAt: number };

export const EPHEMERAL_ACCOUNTS_KEY = "ll_admin_ephemeral_accounts";

export const EPHEMERAL_ACCOUNTS_EVENT = "ll-ephemeral-accounts";

const HANDLE = /^[A-Za-z0-9._]{1,24}$/;

function normalize(raw: string): string | null {
  const value = raw.trim().replace(/^@/, "").toLowerCase();
  return HANDLE.test(value) ? value : null;
}

export function addAccount(
  accounts: EphemeralAccount[],
  username: string,
  now: number = Date.now(),
): EphemeralAccount[] {
  const value = normalize(username);
  if (!value) return accounts;
  if (accounts.some((account) => account.username === value)) return accounts;
  return [...accounts, { username: value, addedAt: now }];
}

export function removeAccount(accounts: EphemeralAccount[], username: string): EphemeralAccount[] {
  const value = normalize(username);
  if (!value) return accounts;
  return accounts.filter((account) => account.username !== value);
}

export function parseAccounts(raw: string | null): EphemeralAccount[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const accounts: EphemeralAccount[] = [];
  for (const row of parsed) {
    if (typeof row !== "object" || row === null) continue;
    const candidate = row as { username?: unknown; addedAt?: unknown };
    if (typeof candidate.username !== "string") continue;
    const value = normalize(candidate.username);
    if (!value) continue;
    if (accounts.some((account) => account.username === value)) continue;
    accounts.push({
      username: value,
      addedAt: typeof candidate.addedAt === "number" ? candidate.addedAt : 0,
    });
  }
  return accounts;
}

export function readStoredAccounts(): EphemeralAccount[] {
  if (typeof window === "undefined") return [];
  return parseAccounts(window.localStorage.getItem(EPHEMERAL_ACCOUNTS_KEY));
}

export function writeStoredAccounts(accounts: EphemeralAccount[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EPHEMERAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new CustomEvent(EPHEMERAL_ACCOUNTS_EVENT));
}
