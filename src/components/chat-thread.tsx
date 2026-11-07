"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IGNORE_REASONS,
  OUTCOME_LABEL,
  clearOutcome,
  dayKey,
  liveLabel,
  markSeen,
  setOutcome,
  type Conversation,
  type IgnoreReason,
  type InboxState,
} from "@/lib/inbox-state";

interface ChatThreadProps {
  conversation: Conversation;
  store: string;
  state: InboxState;
  onStateChange: (next: InboxState) => void;
  onBack: () => void;
}

function timeOf(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ChatThread({ conversation, store, state, onStateChange, onBack }: ChatThreadProps) {
  const [panel, setPanel] = useState<"none" | "ignore" | "whatsapp">("none");
  const [waNumber, setWaNumber] = useState("");

  const closed = conversation.closed;

  // Abrir el hilo marca visto; no cierra el bucle (S7).
  useEffect(() => {
    onStateChange(markSeen(state, store, conversation.tiktokUserId, Date.now()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.key]);

  const groups = useMemo(() => {
    const out: { key: string; label: string; items: typeof conversation.messages }[] = [];
    for (const msg of conversation.messages) {
      const k = dayKey(msg.at);
      const last = out[out.length - 1];
      if (last && last.key === k) last.items.push(msg);
      else out.push({ key: k, label: liveLabel(msg.at), items: [msg] });
    }
    return out;
  }, [conversation.messages]);

  const openDm = () => {
    const handle = conversation.name.startsWith("@") ? conversation.name.slice(1) : conversation.name;
    window.open(`https://www.tiktok.com/@${handle}`, "_blank");
    onStateChange(
      setOutcome(state, store, conversation.tiktokUserId, Date.now(), "contactado", {
        through: conversation.lastAt,
      }),
    );
    toast.success("Marcado como contactado");
  };

  const ignore = (reason: IgnoreReason) => {
    onStateChange(
      setOutcome(state, store, conversation.tiktokUserId, Date.now(), "ignorado", {
        reason,
        through: conversation.lastAt,
      }),
    );
    setPanel("none");
    toast.success("Conversación ignorada");
  };

  const saveNumber = () => {
    const digits = waNumber.trim();
    if (!/^9\d{8}$/.test(digits)) {
      toast.error("El número tiene 9 dígitos y empieza con 9");
      return;
    }
    onStateChange(
      setOutcome(state, store, conversation.tiktokUserId, Date.now(), "whatsapp", {
        waNumber: digits,
        through: conversation.lastAt,
      }),
    );
    setPanel("none");
    setWaNumber("");
    toast.success("Guardado. Ya puedes escribirle por WhatsApp");
  };

  const undo = () => {
    onStateChange(clearOutcome(state, store, conversation.tiktokUserId));
    toast.success("Conversación reabierta");
  };

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: "#0b0f1a" }}>
      {/* Header */}
      <header
        className="shrink-0 px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver a la lista"
          className="md:hidden w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white/85 truncate">{conversation.name}</p>
          <p className="text-[11px] text-white/30">
            {conversation.totalMessages} mensajes · {conversation.liveTags.length}{" "}
            {conversation.liveTags.length === 1 ? "live" : "lives"}
          </p>
        </div>
        {closed && (
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-md shrink-0"
            style={{
              background: closed.state === "ignorado" ? "rgba(255,255,255,0.08)" : "rgba(74,222,128,0.15)",
              color: closed.state === "ignorado" ? "rgba(255,255,255,0.5)" : "#4ade80",
            }}
          >
            {OUTCOME_LABEL[closed.state]}
          </span>
        )}
      </header>

      {/* Closed banner */}
      {closed && (
        <div
          className="shrink-0 px-4 py-2 flex items-center justify-between gap-3 text-[11px]"
          style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-white/40">
            {closed.state === "ignorado"
              ? `Ignorado${closed.reason ? ` · ${IGNORE_REASONS.find((r) => r.key === closed.reason)?.label}` : ""}`
              : closed.state === "whatsapp"
                ? `En WhatsApp${closed.waNumber ? ` · +51 ${closed.waNumber}` : ""}`
                : "Contactado por DM"}
          </span>
          <button type="button" onClick={undo} className="text-[#25f4ee] hover:underline">
            Deshacer
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {groups.map((group) => (
          <div key={group.key} className="space-y-2">
            <div className="flex items-center gap-2 py-1">
              <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-[10px] font-medium text-white/30">{group.label}</span>
              <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
            {group.items.map((msg, i) => (
              <div key={`${msg.at}-${i}`} className="flex justify-start">
                <div
                  className="max-w-[85%] rounded-xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-sm text-white/75 break-words">{msg.text}</p>
                  <p className="text-[10px] text-white/25 mt-1 text-right">{timeOf(msg.at)}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Panels */}
      {panel === "ignore" && (
        <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] text-white/40 mb-2">¿Por qué la ignoras?</p>
          <div className="flex flex-wrap gap-2">
            {IGNORE_REASONS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => ignore(r.key)}
                className="h-8 px-3 rounded-lg text-xs font-medium text-white/60 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPanel("none")}
              className="h-8 px-3 rounded-lg text-xs text-white/30 hover:text-white/60"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {panel === "whatsapp" && (
        <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] text-white/40 mb-2">Número de WhatsApp (9 dígitos)</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/30">+51</span>
            <input
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
              inputMode="numeric"
              placeholder="987654321"
              className="flex-1 h-9 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white/85 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/40"
            />
            <button
              type="button"
              onClick={saveNumber}
              disabled={waNumber.length !== 9}
              className="h-9 px-3 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
              style={{ background: "#fe2c55" }}
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* CTAs del desenlace */}
      <footer
        className="shrink-0 px-4 py-3 flex items-center gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {closed ? (
          <button
            type="button"
            onClick={undo}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Reabrir conversación
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={openDm}
              className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, #fe2c55, #e8254a)" }}
            >
              Abrir en TikTok
            </button>
            <button
              type="button"
              onClick={() => setPanel(panel === "whatsapp" ? "none" : "whatsapp")}
              className="h-10 px-3 rounded-xl text-xs font-semibold text-white/60 hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              + WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setPanel(panel === "ignore" ? "none" : "ignore")}
              className="h-10 px-3 rounded-xl text-xs font-semibold text-white/40 hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Ignorar
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
