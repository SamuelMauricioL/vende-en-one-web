"use client";

import { useEffect, useRef } from "react";
import type { LeadStage } from "@/lib/lead-classifier";

interface LiveEndedDialogProps {
  stageCounts: Record<LeadStage, number>;
  onClose: () => void;
  onGoToHistory: () => void;
}

const STAGE_LABELS: Record<LeadStage, { label: string; color: string }> = {
  compra: { label: "Compra", color: "#fe2c55" },
  negociando: { label: "Negociando", color: "#facc15" },
  interesado: { label: "Interesado", color: "#4ade80" },
};

export function LiveEndedDialog({ stageCounts, onClose, onGoToHistory }: LiveEndedDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const hasLeads = Object.values(stageCounts).some((c) => c > 0);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(11,15,26,0.7)" }}
      onClick={handleBackdrop}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl p-6 animate-in fade-in zoom-in duration-200"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 mx-auto"
          style={{ background: "rgba(254,44,85,0.12)" }}
        >
          <svg className="w-5 h-5" style={{ color: "#fe2c55" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        {/* Title */}
        <h2
          className="text-center text-base font-semibold mb-2"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          Live finalizado
        </h2>

        {/* Body */}
        <p
          className="text-center text-sm leading-relaxed mb-4"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {hasLeads ? (
            <>
              Tus leads de este live están guardados:{" "}
              {(["compra", "negociando", "interesado"] as const).filter((s) => stageCounts[s] > 0).map((s, i, arr) => (
                <span key={s}>
                  <span style={{ color: STAGE_LABELS[s].color }}>
                    {STAGE_LABELS[s].label} ({stageCounts[s]})
                  </span>
                  {i < arr.length - 1 ? ", " : ""}
                </span>
              ))}
              . Ve al Historial para copiar sus @usuarios, ver sus mensajes clave y contactarlos para cerrar la venta.
            </>
          ) : (
            "Este live no capturó leads. Los datos están guardados por si necesitas revisarlos después."
          )}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onGoToHistory}
            className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg"
            style={{
              backgroundColor: "#fe2c55",
              color: "#fff",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Ir al Historial →
          </button>
        </div>
      </div>
    </div>
  );
}
