type PlausibleProps = Record<string, string | number | boolean>;

interface PlausibleOptions {
  props?: PlausibleProps;
  callback?: () => void;
}

declare global {
  interface Window {
    plausible?: (event: string, options?: PlausibleOptions) => void;
  }
}

export function trackEvent(event: string, props?: PlausibleProps): void {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // silently fail — analytics shouldn't break the app
  }
}
