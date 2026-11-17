

export type ContactRow = {
  label: string;
  value: string;
  action: "copy" | "link";
  href?: string;
};

export const COPY_FEEDBACK_MS = 1800;

export type CopyLabels = {
  copied: string;
  copyFallback: string;
};

export function copyOutcome(ok: boolean, labels: CopyLabels): string {
  return ok ? labels.copied : labels.copyFallback;
}
