/** Railway backend base URL for direct SSE connections (bypasses Vercel rewrites) */
const RAILWAY_API = "https://vende-en-one-api-production.up.railway.app";

/**
 * Returns the full URL for an SSE stream, pointing directly to Railway
 * instead of going through Vercel rewrites. This halves connection latency
 * for long-lived SSE connections.
 */
export function getSSEUrl(path: string): string {
  return `${RAILWAY_API}${path}`;
}
