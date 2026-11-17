import { readActing } from "./acting.ts";

export type GetToken = () => Promise<string | null>;

export function actingHeaders(now: number = Date.now()): Record<string, string> {
  const acting = readActing(now);
  return acting ? { "x-acting-as": acting.token } : {};
}

export async function authHeaders(getToken?: GetToken): Promise<Record<string, string>> {
  try {
    const token = getToken ? await getToken() : null;
    return token ? { ...actingHeaders(), Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
