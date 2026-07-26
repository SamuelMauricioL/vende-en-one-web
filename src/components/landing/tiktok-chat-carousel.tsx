"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const avatars = [
  "🦊", "🐱", "🐶", "🐼", "🐸", "🦁", "🐯", "🐰", "🐨", "🐮",
  "🐷", "🐵", "🐔", "🐧", "🦄", "🐲", "🦋", "🐙", "🦀", "🦅",
];

const usernames = [
  "carlos_2391", "luna_mp4", "andrea_gt", "marcos_982", "vale_tk22",
  "sofia_00x", "juanc4_7", "diego_rbk", "camila_s2", "rodri_333",
  "nati_cr7", "felipe_az", "martu_lr", "sebast1an", "paz_mtz",
  "tomas_xd", "isabel_fq", "gabriel_7v", "laura_val", "pablo_888",
  "jime_ok", "nico_mk", "flor_rcs", "agus_121", "cata_xyz",
];

const messages = [
  "¿Cuánto cuesta el envío a Lima?",
  "Todavía hay stock del modelo rojo?",
  "Hola, me interesa, mándame más fotos 🤩",
  "Ya te escribí al WhatsApp!",
  "¿Haces envíos a provincia?",
  "Me encantó, quiero 2 😍",
  "¿Tiene garantía?",
  "¿Aceptas Yape o Plin?",
  "Pasame tu número mejor 🙏",
  "¿Hay descuento por cantidad?",
  "Ya te hice la transferencia!",
  "¿Cuándo me llega?",
  "¿Tallas disponibles?",
  "Lo quiero, apartame uno 🙌",
  "¿Puedo pagar contraentrega?",
  "Ya te sigo, mándame DM 🙋‍♂️",
  "Hermoso producto, quiero uno 🎁",
  "¿Tienes en color negro?",
  "Precio por mayor?",
  "Compro ahora, dónde pago?",
];

function relativeTime(): string {
  const seconds = Math.floor(Math.random() * 180) + 3;
  if (seconds < 60) return `hace ${seconds}s`;
  return `hace ${Math.floor(seconds / 60)}m`;
}

function createMessage(index: number) {
  const msgIndex = index % messages.length;
  return {
    avatar: avatars[msgIndex % avatars.length],
    username: usernames[msgIndex % usernames.length],
    message: messages[msgIndex],
    time: relativeTime(),
    hue: (msgIndex * 37 + 180) % 360,
  };
}

type MessageData = ReturnType<typeof createMessage>;
const MESSAGE_COUNT = 20;

export default function TikTokChatCarousel() {
  const [items] = useState(() =>
    Array.from({ length: MESSAGE_COUNT }, (_, i) => createMessage(i))
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const leavingRef = useRef(false);

  const advance = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
  }, []);

  const handleAnimEnd = useCallback(() => {
    leavingRef.current = false;
    setActiveIndex((prev) => (prev + 1) % MESSAGE_COUNT);
    setLeaving(false);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(advance, 3200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [advance]);

  const current = items[activeIndex];
  const next = items[(activeIndex + 1) % MESSAGE_COUNT];
  const prevIndex = (activeIndex - 1 + MESSAGE_COUNT) % MESSAGE_COUNT;

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative w-full overflow-hidden rounded-xl" style={{ height: 160 }}>
        {/* Incoming message: appears from top */}
        <div
          key={leaving ? "incoming" : "static"}
          className="absolute inset-x-0"
          style={{
            top: 0,
            zIndex: leaving ? 10 : 1,
            animation: leaving ? "slideDownIn 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
          }}
        >
          <TikTokMessage data={leaving ? next : current} />
        </div>

        {/* Outgoing message: slides down and fades */}
        {leaving && (
          <div
            className="absolute inset-x-0"
            style={{
              top: 0,
              zIndex: 5,
              animation: "slideDownOut 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
            }}
            onAnimationEnd={handleAnimEnd}
          >
            <TikTokMessage data={current} />
          </div>
        )}
      </div>
    </div>
  );
}

function TikTokMessage({ data }: { data: MessageData }) {
  return (
    <div
      className="rounded-xl p-3 flex items-start gap-2.5 w-full"
      style={{
        background: "rgba(18, 22, 33, 0.95)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
        style={{
          background: `linear-gradient(135deg, hsl(${data.hue}, 60%, 50%), hsl(${data.hue + 40}, 60%, 35%))`,
        }}
      >
        {data.avatar}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="text-[10px] font-bold px-1.5 py-0.5 rounded leading-none"
            style={{
              background: `linear-gradient(135deg, hsl(${data.hue}, 50%, 40%), hsl(${data.hue + 20}, 50%, 25%))`,
              color: "#fff",
            }}
          >
            LV.{Math.floor(data.hue % 50) + 1}
          </div>
          <span
            className="text-xs font-bold truncate"
            style={{ color: `hsl(${data.hue + 20}, 80%, 70%)` }}
          >
            {data.username}
          </span>
        </div>

        <p className="text-sm text-white/90 leading-relaxed">{data.message}</p>

        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] text-white/20 font-mono">{data.time}</span>
        </div>
      </div>
    </div>
  );
}
