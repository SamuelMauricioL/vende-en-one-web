"use client";

import type { ReactNode } from "react";

interface InboxLayoutProps {
  /** Columna izquierda: chips, buscador y lista de conversaciones. */
  list: ReactNode;
  /** Columna derecha. `null` deja la pantalla de "selecciona una conversación". */
  detail: ReactNode | null;
}

/**
 * Layout tipo WhatsApp: dos columnas en desktop, lista -> hilo en móvil.
 * Presentacional a propósito, para poder verificarlo sin sesión.
 */
export function InboxLayout({ list, detail }: InboxLayoutProps) {
  const hasSelection = detail !== null;

  return (
    <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto flex">
      {/* Columna izquierda */}
      <aside
        className={`${
          hasSelection ? "hidden md:block" : "block"
        } w-full md:w-[22rem] md:shrink-0 md:border-r overflow-y-auto px-4 sm:px-6 md:px-4 py-5`}
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        {list}
      </aside>

      {/* Columna derecha */}
      <section
        className={`${
          hasSelection ? "fixed inset-0 z-50 md:static md:z-auto md:flex-1" : "hidden md:flex md:flex-1"
        } min-h-0`}
      >
        {detail ?? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <svg
                className="w-7 h-7 text-white/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.555-.337A5.97 5.97 0 015.41 20.97a5.97 5.97 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            </div>
            <p className="text-sm text-white/40">Selecciona una conversación</p>
            <p className="text-xs text-white/20 mt-2 max-w-xs">
              Elige un chat de la izquierda para ver todo lo que comentó en tus lives.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
