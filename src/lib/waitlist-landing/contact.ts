/**
 * S8 de `odd/tasks/landing-waitlist.md`: las filas de contacto y el botón de
 * copiar. La regla vive acá y no en el componente para poder probarla sin
 * navegador; el texto de la copia (`Copiar`, `Copiado`, …) llega por props.
 */

export type ContactRow = {
  label: string;
  value: string;
  action: "copy" | "link";
  href?: string;
};

/** Lo que el botón de copiar se queda diciendo el acierto o el fallback. */
export const COPY_FEEDBACK_MS = 1800;

export type CopyLabels = {
  copied: string;
  copyFallback: string;
};

/** `true` cuando el portapapeles escribió de verdad. */
export function copyOutcome(ok: boolean, labels: CopyLabels): string {
  return ok ? labels.copied : labels.copyFallback;
}
