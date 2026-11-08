"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import { leadMessage, leadOutcome, type LeadRow } from "@/lib/filters-api";
import { OUTCOME_COLOR, OUTCOME_LABEL } from "@/lib/inbox-api";
import {
  NO_STAGE_COUNTS,
  STAGE_CONFIG,
  STAGE_ORDER,
  type LeadStage,
} from "@/lib/stages";

import type { CompraLead } from "@/components/purchase-alerts";

import { formatElapsed } from "@/lib/time";

interface LeadsMobileProps {
  sessionId: string;
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
  onConnectionError?: (error: string) => void;
  onStageCountsReport?: (counts: Record<LeadStage, number>) => void;
  onCompraLeads?: (leads: CompraLead[]) => void;
}

/**
 * S4: el servidor ya filtró, clasificó, segmentó y ordenó.
 * Esta pantalla solo pinta `stage`, `stageLabel`, `spans` y, desde S10, el
 * `outcome` que produce el resolutor: el vendedor no marca atendido.
 */
export function LeadsMobile({ sessionId, selectedUserIds, onToggleUser, onConnectionError, onStageCountsReport, onCompraLeads }: LeadsMobileProps) {
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

  const totalUsers = totals?.commented ?? 0;

  const [activeTab, setActiveTab] = useState<LeadStage>("compra");

  // El orden es del servidor: no se reordena acá.
  const filtered = useMemo(() => rows.filter((row) => row.stage === activeTab), [rows, activeTab]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const renderSpans = (row: LeadRow) => {
    const message = leadMessage(row);
    if (!message) return null;
    return (
      <p className="text-xs text-white/50 leading-relaxed line-clamp-1 italic">
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

  const renderLead = (user: LeadRow) => {
    const cfg = STAGE_CONFIG[user.stage];
    const isSelected = selectedUserIds.has(user.tiktokUserId);
    const stageIndex = STAGE_ORDER.indexOf(user.stage);
    const outcome = leadOutcome(user);

    return (
      <button
        key={user.tiktokUserId}
        type="button"
        onClick={() => onToggleUser(user.tiktokUserId)}
        className={`w-full text-left rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
          isSelected ? "ring-1 ring-white/20" : "hover:ring-1 hover:ring-white/10"
        }`}
        style={{
          backgroundColor: isSelected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
          borderLeft: `3px solid ${cfg.color}`,
        }}
      >
        <div className="flex h-0.5 w-full bg-white/[0.03]">
          {STAGE_ORDER.map((s, i) => (
            <div
              key={s}
              className="h-full transition-all duration-300"
              style={{
                flex: 1,
                backgroundColor: i <= stageIndex ? STAGE_CONFIG[s].color : "transparent",
                opacity: i === stageIndex ? 1 : 0.3,
              }}
            />
          ))}
        </div>

        <div className="p-2.5 pt-2">
          <div className="flex items-start gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
              style={{
                backgroundColor: cfg.color,
                boxShadow: user.stage === "compra"
                  ? `0 0 8px ${cfg.color}60`
                  : "none",
              }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="font-semibold text-sm truncate"
                  style={{ color: cfg.color }}
                >
                  {user.nickname || user.displayId || "Anónimo"}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none shrink-0"
                  style={{
                    backgroundColor: `${cfg.color}18`,
                    color: cfg.color,
                  }}
                >
                  {cfg.funnelPct}
                </span>
                <span
                  className="text-[10px] shrink-0 truncate max-w-[90px]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  title={`Filtro: ${user.stageLabel}`}
                >
                  {user.stageLabel}
                </span>
                <span className="text-[10px] text-white/25 shrink-0">
                  {user.comments} msgs
                </span>
                <span className="text-[10px] text-white/20 shrink-0 font-mono tabular-nums">
                  {formatElapsed(user.firstSeen)}
                </span>
                {/* S10: el estado lo marca el resolutor, no el vendedor. */}
                {outcome && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none shrink-0"
                    style={{
                      color: OUTCOME_COLOR[outcome],
                      backgroundColor: "rgba(255,255,255,0.06)",
                    }}
                  >
                    {OUTCOME_LABEL[outcome]}
                  </span>
                )}
              </div>

              {renderSpans(user)}
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-white/80">Leads en vivo</h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            status === "live" ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" :
            status === "connecting" ? "bg-yellow-500 animate-pulse" :
            "bg-red-500"
          }`} />
          <span className="text-xs text-white/40">{totalUsers} interactuaron</span>
        </div>
      </div>

      <div className="flex mb-3 rounded-xl overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {STAGE_ORDER.map((stage) => {
          const isActive = activeTab === stage;
          const cfg = STAGE_CONFIG[stage];
          const count = counts[stage];
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setActiveTab(stage)}
              className="flex-1 py-2 text-[11px] font-semibold transition-all duration-200 flex items-center justify-center gap-1"
              style={{ color: isActive ? cfg.color : `${cfg.color}99` }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: cfg.color }}
              />
              {cfg.label}
              {count > 0 && (
                <span className="text-[10px] font-mono" style={{ opacity: isActive ? 1 : 0.5 }}>
                  {count}
                </span>
              )}
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
        ) : filtered.length === 0 ? (
          <p className="text-sm text-white/20 text-center py-8">
            No hay leads en &ldquo;{STAGE_CONFIG[activeTab].label}&rdquo;
          </p>
        ) : (
          filtered.map((user) => renderLead(user))
        )}
      </div>
    </div>
  );
}
