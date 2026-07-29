"use client";

import { useEffect, useMemo } from "react";

interface UserMessagesDialogProps {
  nickname: string;
  commentTexts: string[];
  onClose: () => void;
}

const USER_COLORS = [
  "#ff0050", "#00f2ea", "#ff6b35", "#ffd700",
  "#ff69b4", "#7c3aed", "#06d6a0", "#f72585",
  "#4cc9f0", "#e63946", "#2ec4b6", "#ff9f1c",
  "#b5179e", "#4361ee", "#f77f00", "#80ed99",
];

function getUserColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function UserMessagesDialog({ nickname, commentTexts, onClose }: UserMessagesDialogProps) {
  const color = getUserColor(nickname);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Group consecutive duplicate messages: [{text, count}, ...]
  const grouped = useMemo(() => {
    const result: { text: string; count: number }[] = [];
    for (const msg of commentTexts) {
      const last = result[result.length - 1];
      if (last && last.text === msg) {
        last.count++;
      } else {
        result.push({ text: msg, count: 1 });
      }
    }
    return result;
  }, [commentTexts]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(11,15,26,0.7)" }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          maxHeight: "70vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-semibold truncate" style={{ color }}>
              {nickname}
            </span>
            <span className="text-xs text-white/30 font-mono tabular-nums shrink-0">
              {commentTexts.length} mensajes
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all shrink-0"
          >
            <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="overflow-y-auto px-4 py-3 space-y-2">
          {grouped.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">Sin mensajes guardados</p>
          ) : (
            grouped.map((item, i) => (
              <div
                key={i}
                className="rounded-xl px-3.5 py-2.5"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-start gap-2">
                  <p className="text-sm text-white/90 leading-relaxed break-words flex-1 min-w-0">{item.text}</p>
                  {item.count > 1 && (
                    <span
                      className="shrink-0 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md mt-0.5"
                      style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
                    >
                      ×{item.count}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
