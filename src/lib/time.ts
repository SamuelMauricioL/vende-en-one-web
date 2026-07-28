/**
 * Formato compacto de tiempo transcurrido.
 * Ej: "15s", "2m 12s", "1h 3m", "2h 15m"
 */
export function formatElapsed(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const totalSec = Math.floor(diff / 1000);

  if (totalSec < 0) return "0s";
  if (totalSec < 60) return `${totalSec}s`;

  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;

  if (min < 60) {
    if (sec === 0) return `${min}m`;
    return `${min}m ${sec}s`;
  }

  const h = Math.floor(min / 60);
  const m = min % 60;

  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
