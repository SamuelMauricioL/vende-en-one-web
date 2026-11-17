import { readActing } from "./acting.ts";

/** Token de Clerk tal como lo expone `useAuth()`. */
export type GetToken = () => Promise<string | null>;

export function actingHeaders(now: number = Date.now()): Record<string, string> {
  const acting = readActing(now);
  return acting ? { "x-acting-as": acting.token } : {};
}

/**
 * Header Authorization para las llamadas al API.
 * Si no hay token se omite: el API responde 401 y el fallo es visible,
 * nunca una petición anónima silenciosa.
 */
export async function authHeaders(getToken?: GetToken): Promise<Record<string, string>> {
  try {
    const token = getToken ? await getToken() : null;
    return token ? { ...actingHeaders(), Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
