import { track } from "@vercel/analytics";

type EventData = Record<string, string | number | boolean>;

export function trackEvent(event: string, data?: EventData): void {
  try {
    track(event, data);
  } catch {
    // silently fail
  }
}
