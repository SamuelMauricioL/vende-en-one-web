"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { toast } from "sonner";
import { authHeaders } from "@/lib/api-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VerificationDialogProps {
  open: boolean;
  handle: string;
  onClose: () => void;
  onVerified: () => void | Promise<void>;
}

function displayCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.length === 6 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : raw;
}

function verificationError(status: number, serverMessage?: string): string {
  switch (status) {
    case 400:
      return "No encontramos ese código en tu bio. Pégalo tal cual y guarda los cambios; si ya lo cambiaste, genera un código nuevo.";
    case 404:
      return "No hay una verificación pendiente (el código pudo vencer). Genera un código nuevo.";
    case 409:
      return serverMessage || "Esa cuenta de TikTok ya está verificada por otra cuenta.";
    case 429:
      return "Hicimos demasiados intentos. Espera unos minutos y genera un código nuevo.";
    case 503:
      return "No pudimos leer tu perfil de TikTok. No se guardó nada: vuelve a intentar en un momento.";
    default:
      return serverMessage || "No pudimos verificar tu TikTok. Intenta de nuevo.";
  }
}

function formatExpiry(expiresAt: number | null): string {
  if (!expiresAt || !Number.isFinite(expiresAt)) return "";
  return new Date(expiresAt).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PRIMARY_BUTTON =
  "h-10 rounded-xl text-xs font-semibold text-white transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/60 disabled:opacity-40";
const SECONDARY_BUTTON =
  "h-10 rounded-xl text-xs font-semibold text-white/60 transition-colors outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-40";

export default function VerificationDialog({
  open,
  handle,
  onClose,
  onVerified,
}: VerificationDialogProps) {
  const { getToken } = useAuth();
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const requestedFor = useRef("");

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      const headers = { ...(init?.headers ?? {}), ...(await authHeaders(getToken)) };
      return fetch(path, { ...init, headers });
    },
    [getToken],
  );

  const startCode = useCallback(
    async (username: string) => {
      setWorking(true);
      setError("");
      try {
        const res = await api("/api/users/tiktok/verification/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tiktokUsername: username }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { message?: string };
          setError(verificationError(res.status, data.message));
          return;
        }

        const data = (await res.json().catch(() => ({}))) as {
          code?: string;
          expiresAt?: number;
        };
        if (!data.code) {
          setError("No pudimos generar el código. Intenta de nuevo.");
          return;
        }

        setCode(displayCode(data.code));
        setExpiresAt(typeof data.expiresAt === "number" ? data.expiresAt : null);
      } catch {
        setError("No pudimos conectar con el servidor. Intenta de nuevo.");
      } finally {
        setWorking(false);
      }
    },
    [api],
  );

  useEffect(() => {
    if (!open || !handle) return;
    if (requestedFor.current === handle) return;
    requestedFor.current = handle;
    void startCode(handle);
  }, [open, handle, startCode]);

  const confirm = useCallback(async () => {
    if (!code) return;
    setWorking(true);
    setError("");
    try {
      const res = await api("/api/users/tiktok/verification/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiktokUsername: handle, code }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(verificationError(res.status, data.message));
        return;
      }

      toast.success("Tu cuenta de TikTok ya está verificada.");
      onClose();
      await onVerified();
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setWorking(false);
    }
  }, [api, code, handle, onClose, onVerified]);

  const expiry = formatExpiry(expiresAt);
  const codeNote = code
    ? expiry
      ? `Vence a las ${expiry}.`
      : "El código vence en unos minutos."
    : working
      ? "Generando tu código…"
      : "Pide un código para empezar.";
  const errorText = error ? <p className="text-[11px] text-[#fe2c55]">{error}</p> : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Valida que la cuenta es tuya</DialogTitle>
          <DialogDescription>
            Comprobamos que{" "}
            <span className="font-semibold text-white/70">@{handle}</span> es tuya con un
            código en la biografía de TikTok.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <p className="text-xs leading-relaxed text-white/60">
            Pega este código en la biografía de{" "}
            <span className="font-semibold text-white/85">@{handle}</span> y guarda los
            cambios.
          </p>

          <div
            className="rounded-xl px-4 py-3 text-center"
            style={{
              background: "rgba(254,44,85,0.08)",
              border: "1px solid rgba(254,44,85,0.3)",
            }}
          >
            <span
              className="block font-mono text-2xl font-extrabold tracking-[0.2em]"
              style={{ color: "#fe2c55" }}
            >
              {code || "— — —"}
            </span>
            <span className="mt-1 block text-[10px] text-white/35">{codeNote}</span>
          </div>

          <p className="text-xs leading-relaxed text-white/60">
            Espera al menos <span className="font-semibold text-white/85">1 minuto</span>:
            seguimos revisando tu perfil solos, cinco veces, una por minuto, así que no
            necesitas quedarte mirando la pantalla. Si ya lo pegaste, puedes validar a mano
            cuando quieras.
          </p>

          {errorText}

          <DialogFooter>
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={working || !code}
              className={PRIMARY_BUTTON}
              style={{ background: "#fe2c55" }}
            >
              {working && code ? "Validando…" : "Ya lo pegué, validar ahora"}
            </button>
            <button
              type="button"
              onClick={() => void startCode(handle)}
              disabled={working || !handle}
              className={SECONDARY_BUTTON}
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {working && !code ? "Generando código…" : "Generar un código nuevo"}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
