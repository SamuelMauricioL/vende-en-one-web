"use client";

import { useEffect, useRef } from "react";
import { STAGE_CONFIG, STAGE_ORDER, type LeadStage } from "@/lib/lead-classifier";

interface LiveEndedDialogProps {
  stageCounts: Record<LeadStage, number>;
  onClose: () => void;
  onGoToHistory: () => void;
}

const STAGE_LABELS_SHORT: Record<LeadStage, string> = {
  compra: "Compra",
  negociando: "Negociando",
  interesado: "Interesado",
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
      style={{ backgroundColor: "rgba(11,15,26,0.85)" }}
      onClick={handleBackdrop}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md"
        style={{
          background: "rgba(16, 20, 32, 0.96)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "32px 28px",
        }}
      >
        {/* Icon — checkmark circle: "data safely saved" */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(34,197,94,0.12)" }}
        >
          <svg className="w-5.5 h-5.5" style={{ color: "#22C55E" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Title */}
        <h2
          className="text-center text-base font-semibold mb-1"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          Live finalizado
        </h2>

        {/* Body — one line, confident */}
        <p
          className="text-center text-sm mb-5"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Tus leads están guardados
        </p>

        {/* Stage count pills — scannable, colored, consistent with app chips */}
        {hasLeads && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {STAGE_ORDER.filter((s) => stageCounts[s] > 0).map((stage) => {
              const cfg = STAGE_CONFIG[stage];
              const count = stageCounts[stage];
              return (
                <div
                  key={stage}
                  className="flex flex-1 flex-col items-center gap-1 rounded-xl px-4 py-2.5"
                  style={{
                    backgroundColor: `${cfg.color}12`,
                    border: `1px solid ${cfg.color}25`,
                  }}
                >
                  <span
                    className="text-lg font-bold tabular-nums leading-none"
                    style={{ color: cfg.color }}
                  >
                    {count}
                  </span>
                  <span
                    className="text-xs font-medium leading-none"
                    style={{ color: `${cfg.color}bb` }}
                  >
                    {STAGE_LABELS_SHORT[stage]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!hasLeads && (
          <p
            className="text-center text-xs mb-6"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Este live no capturó leads
          </p>
        )}

        {/* Primary CTA — full-width, prominent */}
        <button
          type="button"
          onClick={onGoToHistory}
          className="w-full h-11 rounded-xl text-sm font-semibold transition-all duration-200 mb-3"
          style={{
            backgroundColor: "#fe2c55",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(254,44,85,0.25)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e8254a"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(254,44,85,0.35)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fe2c55"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(254,44,85,0.25)"; }}
        >
          Ir al Historial →
        </button>

        {/* Secondary — text link, de-emphasized */}
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-xs font-medium transition-all duration-200 cursor-pointer"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
