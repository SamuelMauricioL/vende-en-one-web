"use client";

import { useEffect, useRef, useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import { leadMessage, type LeadRow } from "@/lib/filters-api";
import {
  NO_STAGE_COUNTS,
  STAGE_CONFIG,
  STAGE_ORDER,
  type LeadStage,
} from "@/lib/stages";

import type { CompraLead } from "@/components/purchase-alerts";

const STAGE_EMOJI: Record<string, string> = {
  compra: "🔥",
  negociando: "💬",
  interesado: "👀",
};

interface TopUsersProps {
  sessionId: string;
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
  attendedMap: Map<string, { attendedAt: number; commentCount: number }>;
  onToggleAttended: (userId: string, commentCount?: number) => void;
  maxMobileItems?: number;
  onConnectionError?: (error: string) => void;
  onStageCountsReport?: (counts: Record<LeadStage, number>) => void;
  onCompraLeads?: (leads: CompraLead[]) => void;
}

/**
 * S4: el servidor ya filtró, clasificó, segmentó y ordenó.
 * Esta pantalla solo pinta `stage`, `stageLabel` y `spans`.
 */
export function TopUsers({ sessionId, selectedUserIds, onToggleUser, attendedMap, onToggleAttended, maxMobileItems, onConnectionError, onStageCountsReport, onCompraLeads }: TopUsersProps) {
  const { data: users, totals, connected, status, connectionError } = useSSE<LeadRow>(
    `/lives/${sessionId}/stats/stream`,
    sessionId,
  );

  useEffect(() => {
    if (status === "ended" && onConnectionError) {
      onConnectionError("El live ha finalizado");
    } else if (status === "error" && connectionError && onConnectionError) {
      onConnectionError(connectionError);
    }
  }, [status, connectionError, onConnectionError]);

  const rows = users ?? [];

  // `totals` manda en los contadores: el crudo son todos los que comentaron.
  const counts = totals?.byStage ?? NO_STAGE_COUNTS;

  // Report stage counts to parent
  useEffect(() => {
    if (!onStageCountsReport || rows.length === 0) return;
    onStageCountsReport(counts);
  }, [counts, rows.length, onStageCountsReport]);

  // Report purchase leads so the parent can raise floating alerts
  useEffect(() => {
    if (!onCompraLeads) return;
    onCompraLeads(
      rows
        .filter((row) => row.stage === "compra")
        .map((row) => ({
          tiktokUserId: row.tiktokUserId,
          name: row.nickname || row.displayId || "Anónimo",
          message: leadMessage(row),
        })),
    );
  }, [rows, onCompraLeads]);

  // Auto-unattend: if an attended user sent new messages, move back to pending
  useEffect(() => {
    if (rows.length === 0) return;
    for (const row of rows) {
      const info = attendedMap.get(row.tiktokUserId);
      if (info && row.comments > info.commentCount) {
        onToggleAttended(row.tiktokUserId);
      }
    }
  }, [rows, attendedMap, onToggleAttended]);

  const [tick, setTick] = useState(0);
  const [activeStage, setActiveStage] = useState<"all" | LeadStage>("all");

  // Auto-select best stage once on first load, never override manual tab
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (hasAutoSelected.current || rows.length === 0) return;
    for (const stage of STAGE_ORDER) {
      if (counts[stage] > 0) {
        setActiveStage(stage);
        break;
      }
    }
    hasAutoSelected.current = true;
  }, [rows.length, counts]);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // El orden es del servidor: no se reordena acá.
  const pendingList = rows
    .filter((row) => !attendedMap.has(row.tiktokUserId))
    .filter((row) => activeStage === "all" || row.stage === activeStage);
  const attendedList = rows
    .filter((row) => attendedMap.has(row.tiktokUserId))
    .filter((row) => activeStage === "all" || row.stage === activeStage)
    .sort((a, b) => {
      const aTime = attendedMap.get(a.tiktokUserId)?.attendedAt ?? 0;
      const bTime = attendedMap.get(b.tiktokUserId)?.attendedAt ?? 0;
      return bTime - aTime;
    });

  const totalUsers = totals?.commented ?? 0;

  const renderSpans = (row: LeadRow) => {
    const message = leadMessage(row);
    if (!message) return null;
    return (
      <p
        className="text-xs text-white/50 leading-relaxed truncate mt-0.5"
        style={{ textDecoration: attendedMap.has(row.tiktokUserId) ? "line-through" : "none" }}
      >
        {row.spans.length > 0
          ? row.spans.map((span, i) =>
              span.strong ? (
                <strong key={i} className="font-bold text-white/80">{span.text}</strong>
              ) : (
                <span key={i}>{span.text}</span>
              ),
            )
          : message}
      </p>
    );
  };

  const renderLead = (user: LeadRow, index: number, isAttended: boolean) => {
    const hideOnMobile = maxMobileItems && index >= maxMobileItems;
    const cfg = STAGE_CONFIG[user.stage];
    const isSelected = selectedUserIds.has(user.tiktokUserId);

    return (
      <button
        key={user.tiktokUserId}
        type="button"
        onClick={() => onToggleUser(user.tiktokUserId)}
        className={`w-full text-left transition-all duration-200 cursor-pointer ${
          isSelected ? "ring-1 ring-white/20 rounded-lg" : "hover:ring-1 hover:ring-white/10 rounded-lg"
        } ${hideOnMobile ? "max-md:hidden" : ""}`}
        style={{
          backgroundColor: isSelected
            ? "rgba(255,255,255,0.08)"
            : "transparent",
        }}
      >
        <div className="flex items-start gap-2.5 px-2.5 py-2">
          {/* Stage dot */}
          <span
            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
            style={{ backgroundColor: cfg.color }}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-sm font-semibold truncate max-w-[140px] sm:max-w-[200px]"
                style={{
                  color: isAttended ? "rgba(255,255,255,0.3)" : cfg.color,
                  textDecoration: isAttended ? "line-through" : "none",
                }}
              >
                {user.nickname || user.displayId || "Anónimo"}
              </span>
              <span className="text-[11px] shrink-0">{STAGE_EMOJI[user.stage]}</span>
              {user.stageLabel && (
                <span
                  className="text-[10px] shrink-0 truncate max-w-[110px]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  title={`Filtro: ${user.stageLabel}`}
                >
                  {user.stageLabel}
                </span>
              )}
            </div>

            {renderSpans(user)}
          </div>

          {/* Atender button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleAttended(user.tiktokUserId, user.comments); }}
            className="shrink-0 flex items-center gap-1 rounded-lg transition-all duration-200 px-2 py-1 mt-0.5"
            style={{
              backgroundColor: isAttended ? `${cfg.color}20` : "rgba(255,255,255,0.04)",
              border: `1px solid ${isAttended ? cfg.color : "rgba(255,255,255,0.08)"}`,
              opacity: isAttended ? 0.7 : 1,
            }}
            title={isAttended ? "Marcado como atendido" : "Marcar como atendido"}
          >
            <svg
              className="w-3 h-3 transition-all"
              style={{ color: isAttended ? cfg.color : "rgba(255,255,255,0.3)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={isAttended ? 2.5 : 1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span
              className="text-[10px] font-medium hidden sm:inline"
              style={{ color: isAttended ? cfg.color : "rgba(255,255,255,0.4)" }}
            >
              {isAttended ? "Atendido" : "Atender"}
            </span>
          </button>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white/80">Leads en vivo</h3>
          <a
            href="/app/filters"
            className="text-[10px] font-medium transition-colors hover:opacity-80"
            style={{ color: "rgba(254,44,85,0.6)" }}
          >
            Filtros
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            status === "live" ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" :
            status === "connecting" ? "bg-yellow-500 animate-pulse" :
            "bg-red-500"
          }`} />
          <span className="text-xs text-white/40">{totalUsers} interactuaron</span>
        </div>
      </div>

      {/* Stage filter tabs */}
      <div className="flex items-center gap-1 mb-3 shrink-0 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveStage("all")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
          style={{
            backgroundColor: activeStage === "all" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
            color: activeStage === "all" ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
          }}
        >
          Todos <span className="font-mono tabular-nums text-[11px]">{totalUsers}</span>
        </button>
        {STAGE_ORDER.map((stage) => {
          const count = counts[stage];
          const cfg = STAGE_CONFIG[stage];
          const isActive = activeStage === stage;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setActiveStage(isActive ? "all" : stage)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
              style={{
                backgroundColor: isActive ? `${cfg.color}20` : "rgba(255,255,255,0.04)",
                color: isActive ? cfg.color : `${cfg.color}99`,
              }}
            >
              {/* Colored dot — always visible so stage-color association is clear */}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: cfg.color }}
              />
              {cfg.label}
              <span className="font-mono tabular-nums text-[11px]" style={{ opacity: isActive ? 1 : 0.5 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
        {rows.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-12">
            {status === "error"
              ? `Error de conexión: ${connectionError || "desconocido"}`
              : status === "connecting"
                ? "Conectando al live..."
                : connected
                  ? "Esperando mensajes..."
                  : "Conectando..."}
          </p>
        ) : (
          <>
            {pendingList.length === 0 && attendedList.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-12">Esperando mensajes...</p>
            ) : (
              <>
                {pendingList.map((user, index) => renderLead(user, index, false))}

                {attendedList.length > 0 && (
                  <div className="flex items-center gap-3 py-2 mt-2 mb-1">
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <span className="text-[10px] font-medium text-white/20 shrink-0">
                      Atendidos ({attendedList.length})
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  </div>
                )}

                {attendedList.map((user, index) => renderLead(user, index, true))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
