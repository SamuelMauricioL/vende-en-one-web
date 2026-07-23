type UmamiData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: UmamiData) => void;
    };
  }
}

export function trackEvent(event: string, data?: UmamiData): void {
  if (typeof window === "undefined") return;
  try {
    window.umami?.track(event, data);
  } catch {
    // silently fail
  }
}
