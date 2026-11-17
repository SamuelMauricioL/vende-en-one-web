
const RAILWAY_API = "https://vende-en-one-api-production.up.railway.app";
const RAILWAY_WS = "wss://vende-en-one-api-production.up.railway.app";

export function getSSEUrl(path: string): string {
  return `${RAILWAY_API}${path}`;
}

export function liveStatusPath(username: string): string {
  return `/api/lives/${encodeURIComponent(username)}/status`;
}

export function getMonitorWS(username: string, ticket: string): string {
  return `${RAILWAY_WS}/lives/monitor/${encodeURIComponent(username)}?ticket=${encodeURIComponent(ticket)}`;
}
