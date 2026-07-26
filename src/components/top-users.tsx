"use client";

import { useEffect, useMemo, useState } from "react";
import { useSSE } from "@/hooks/useSSE";

interface TopUser {
  tiktokUserId: string;
  displayId?: string;
  nickname?: string;
  verified?: boolean;
  followerCount?: string;
  entries: number;
  comments: number;
  commentTexts: string[];
  firstSeen: number;
  score: number;
}

interface TopUsersProps {
  sessionId: string;
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
}

type LeadStage = "interesado" | "negociando" | "compra";

const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; funnelPct: string }> = {
  interesado: { label: "Interesado", color: "#4ade80", funnelPct: "40%" },
  negociando: { label: "Negociando", color: "#facc15", funnelPct: "18%" },
  compra:      { label: "Compra", color: "#fe2c55", funnelPct: "3%" },
};

const STAGE_ORDER: LeadStage[] = ["compra", "negociando", "interesado"];
const STAGE_COLORS = STAGE_ORDER.map((s) => STAGE_CONFIG[s].color);

// Funnel bar widths (decreasing to mimic funnel shape)
const FUNNEL_BAR_PCT: Record<LeadStage, number> = {
  interesado: 75,
  negociando: 40,
  compra: 15,
};

const INTENT_PATTERNS: { stage: LeadStage; keywords: RegExp[] }[] = [
  {
    stage: "compra",
    keywords: [
      // Purchase intent
      /compro/i, /quiero\s+\d/i, /aparta/i, /ya te hice/i, /dónde pago/i,
      /lo quiero/i, /transfier/i, /ya pagu/i, /deposit/i,
      // Quantity / taking
      /quiero (uno|un[oa]|comprar|ya)/i, /llevo\s+\d/i, /me llevo/i,
      /llévame/i, /apártame/i, /apartado/i, /reserv/i, /encarga/i,
      /pídelo/i, /anótame/i, /apuntame/i,
      // Payment methods
      /yape/i, /plin/i, /contraentrega/i, /contra entrega/i,
      /pago contra/i, /envío contra/i,
      // Banking / transfers
      /deposit/i, /abon/i, /transferencia/i, /transferir/i,
      /bancaria/i, /cuenta\s+(bancaria|de ahorro|corriente)/i,
      /BCP/i, /BBVA/i, /interbank/i, /scotiabank/i, /bancolombia/i,
      /número de cuenta/i, /código QR/i, /link de pago/i,
      /qr\b/i, /datos (de pago|bancarios)/i,
      // Payment confirmation
      /comprobante/i, /voucher/i, /captura/i,
      /ya (pagué|deposité|transferí|yapeé|plineé|te transferí)/i,
      /listo ya pagué/i, /pago realizado/i, /confirmar pago/i,
      /confirma porfa/i,
      // Direct contact (high purchase intent)
      /whatsapp/i, /whatsap/i, /wsp\b/i, /wp\b/i,
      /al dm/i, /al interno/i, /mensaje privado/i, /inbox/i,
      /mensaje directo/i, /md\b/i,
      /escríbeme/i, /escríbeme al/i, /contáctame/i, /comunícate/i,
      /teléfono/i, /celular/i, /cel\b/i,
      /pasame tu (número|whatsapp|wp|wsp)/i,
      /me das tu número/i, /me pasas tu/i,
      /mándame (dm|mensaje|un dm|un mensaje)/i,
      /envíame un dm/i,
      // Urgency
      /hoy mismo/i, /ahora mismo/i, /en este momento/i, /ya mismo/i,
      /urgente/i, /lo necesito ya/i, /lo quiero ya/i,
      /para hoy/i, /para mañana/i, /lo antes posible/i,
      // Address / delivery coordination
      /dirección/i, /domicilio/i, /envía a/i, /reparto/i, /reparten/i,
      /recoger/i, /recojo/i, /vengo a/i, /paso a/i,
      /dónde (va|lo mando|lo envías)/i,
      // Payment methods (carrier)
      /efectivo/i, /tarjeta/i, /crédito/i, /débito/i,
      /pago (móvil|movil|con tarjeta|en efectivo)/i,
    ],
  },
  {
    stage: "negociando",
    keywords: [
      // Price
      /precio/i, /cuánto cuesta/i, /cuánto (vale|es|cuesta|está)/i,
      /a cómo/i, /en cuánto/i, /cuál es el precio/i,
      /vale\s*\d/i, /cuesta/i, /precios/i,
      /\$\s*\d/i, /\d+\s*(soles|pesos)/i,
      /me das el precio/i, /me pasas precio/i, /precio por interno/i,
      /lista de precio/i, /precio por mayor/i, /precio al por mayor/i,
      /precio por cantidad/i, /precio x mayor/i,
      // Shipping / delivery
      /envío/i, /envían/i, /envías/i, /hacen envío/i,
      /envío gratis/i, /cuánto (el envío|el delivery)/i,
      /delivery/i, /cuánto el delivery/i,
      /tiempo de entrega/i, /demora/i, /cuándo llega/i,
      // Stock / availability
      /stock/i, /disponible/i, /hay de/i, /lo tienes/i,
      /tienes en/i, /disponible en/i, /todavía hay/i,
      /lo vendes/i, /vendes/i,
      // Product details
      /talla/i, /tallas disponibles/i, /tamaño/i, /medidas/i,
      /color/i, /colores disponibles/i, /modelo/i,
      /garantía/i, /tiene garantía/i,
      /descuento/i, /oferta/i, /promoción/i,
      /por mayor/i, /mayorista/i, /al por mayor/i,
      /por cantidad/i, /pack/i, /combo/i, /incluye/i, /viene con/i,
      /material/i, /de qué (está hecho|es)/i,
      /calidad/i, /original/i, /réplica/i,
      /funciona/i, /especificaciones/i, /descripción/i,
      /batería/i, /peso/i, /capacidad/i, /versión/i, /tipo de/i,
      /cómo (es|funciona|se usa|se utiliza)/i,
      /caracter/i,
      /cuándo me llega/i, /cuándo (lo|me) (mandas|envías)/i,
    ],
  },
  {
    stage: "interesado",
    keywords: [
      /me interesa/i, /me interesa mucho/i,
      /me encant/i, /me gusta/i,
      /hermoso/i, /hermosa/i, /lind[oa]/i, /precios[oa]/i,
      /bonit[oa]/i, /que bonito/i,
      /espectacular/i, /increíble/i, /genial/i,
      /buen producto/i, /se ve (bien|padre|genial|increíble)/i,
      /wow/i, /me late/i,
      /fotos?/i, /manda foto/i, /más fotos/i, /pasa foto/i,
      /enseña/i, /muéstrame/i, /a ver/i, /se mira/i,
      /info/i, /más detalles/i, /más info/i,
      /info por fa/i, /información/i,
      /quiero ver/i, /me gustaría ver/i,
      /llama (la atención|mi atención)/i,
      /que (lindo|hermoso|bonito|espectacular)/i,
      /me interesa mucho/i, /estoy interesad[oa]/i,
    ],
  },
];

// Returns null if user has no comment data (can't determine intent)
function classifyLead(comments: string[]): LeadStage | null {
  if (!comments || comments.length === 0) return null;

  const allText = comments.join(" ");
  for (const group of INTENT_PATTERNS) {
    for (const pattern of group.keywords) {
      if (pattern.test(allText)) return group.stage;
    }
  }
  return "interesado";
}

function getKeyAction(comments: string[]): string | null {
  const allText = comments.join(" ");
  for (const group of INTENT_PATTERNS) {
    for (const pattern of group.keywords) {
      if (pattern.test(allText)) {
        const matchedComment = comments.find((c) => pattern.test(c));
        if (matchedComment) return matchedComment;
      }
    }
  }
  return comments[0] ?? null;
}

function getStageIndex(stage: LeadStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function TopUsers({ sessionId, selectedUserIds, onToggleUser }: TopUsersProps) {
  const { data: users, connected } = useSSE<TopUser>(
    `/api/lives/${sessionId}/stats/stream`,
  );

  const enriched = useMemo(() => {
    if (!users) return [];
    return users
      .map((u) => {
        const stage = classifyLead(u.commentTexts);
        if (!stage) return null; // skip users with no comment data
        const keyAction = getKeyAction(u.commentTexts);
        return { ...u, stage, keyAction };
      })
      .filter(Boolean) as (TopUser & { stage: LeadStage; keyAction: string | null })[];
  }, [users]);

  const grouped = useMemo(() => {
    const groups: Record<LeadStage, (typeof enriched)[number][]> = {
      interesado: [], negociando: [], compra: [],
    };
    for (const u of enriched) {
      if (groups[u.stage]) groups[u.stage].push(u);
    }
    return groups;
  }, [enriched]);

  const totalUsers = enriched.length;

  const maxStageCount = Math.max(
    ...STAGE_ORDER.map((s) => grouped[s].length),
    1,
  );

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/80">Leads en vivo</h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} />
          <span className="text-xs text-white/40">{totalUsers} interactuaron</span>
        </div>
      </div>

      {/* Visual funnel */}
      <div className="mb-5 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="px-3 pt-2.5 pb-3">
          <div className="flex flex-col items-center gap-1">
            {STAGE_ORDER.map((stage) => {
              const count = grouped[stage].length;
              const cfg = STAGE_CONFIG[stage];
              const pctWidth = FUNNEL_BAR_PCT[stage];
              const barHeight = Math.max(6, count === 0 ? 4 : (count / maxStageCount) * 20);

              return (
                <div key={stage} className="flex items-center gap-2 w-full">
                  <span
                    className="text-[10px] font-medium w-14 text-right shrink-0"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>

                  <div className="flex-1 flex justify-center">
                    <div
                      className="rounded-full transition-all duration-500"
                      style={{
                        width: `${pctWidth}%`,
                        height: barHeight,
                        backgroundColor: `${cfg.color}25`,
                        border: `1px solid ${cfg.color}30`,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: count === 0 ? "0%" : `${Math.max(5, (count / Math.max(maxStageCount, 1)) * 100)}%`,
                          backgroundColor: cfg.color,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>

                  <span className="text-[10px] text-white/40 w-6 text-left shrink-0 font-mono">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[420px] pr-1">
        {!enriched || enriched.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-12">
            {connected ? "Esperando mensajes..." : "Conectando..."}
          </p>
        ) : (
          enriched.map((user) => {
            const cfg = STAGE_CONFIG[user.stage];
            const isSelected = selectedUserIds.has(user.tiktokUserId);
            const stageIndex = getStageIndex(user.stage);

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
                {/* Stage progress line */}
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

                <div className="p-3 pt-2.5">
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
                      </div>

                      {user.keyAction && (
                        <p className="text-xs text-white/50 leading-relaxed mt-1 line-clamp-2 italic">
                          &ldquo;{user.keyAction}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/25">
                        <span>{user.entries} visitas</span>
                        <span>{user.comments} msgs</span>
                        {user.followerCount && (
                          <span>{user.followerCount} seguidores</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
