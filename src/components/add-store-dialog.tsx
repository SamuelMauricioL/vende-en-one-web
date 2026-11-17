"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { toast } from "sonner";
import { authHeaders } from "@/lib/api-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddStoreDialogProps {
  open: boolean;
  onClose: () => void;
  /** Recarga la lista de tiendas después de agregar. */
  onAdded: () => void | Promise<void>;
}

type Step = "handle" | "code";

/** Acepta "@cuenta", "cuenta" o el enlace del perfil, igual que el CTA del Live. */
function normalizeHandle(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const fromUrl = /(?:tiktok\.com\/)@?([A-Za-z0-9._]+)/i.exec(value);
  const candidate = fromUrl ? fromUrl[1] : value.replace(/^@/, "");
  return /^[A-Za-z0-9._]{2,}$/.test(candidate) ? candidate.toLowerCase() : null;
}

/**
 * Los mismos mensajes que el paso de verificación del onboarding: el API
 * responde estos códigos cuando no puede confirmar el código de la bio.
 * El 409 tiene más de una causa (cuenta ya verificada por otra cuenta, tope de
 * tiendas), así que ahí manda el mensaje del servidor.
 */
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

/** "21:34" si la fecha del API es válida; cadena vacía si no. */
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

/**
 * Agregar tienda: @ + código en la bio (`verification/start` → `verification/confirm`).
 * El diálogo no se cierra con el fondo ni con Escape: la única salida es la X.
 */
export default function AddStoreDialog({
  open,
  onClose,
  onAdded,
}: AddStoreDialogProps) {
  const { getToken } = useAuth();
  const [step, setStep] = useState<Step>("handle");
  const [input, setInput] = useState("");
  const [handle, setHandle] = useState("");
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      const headers = { ...(init?.headers ?? {}), ...(await authHeaders(getToken)) };
      return fetch(path, { ...init, headers });
    },
    [getToken],
  );

  // Cada apertura arranca limpia: no se arrastra el código de la vez anterior.
  useEffect(() => {
    if (open) return;
    setStep("handle");
    setInput("");
    setHandle("");
    setCode("");
    setExpiresAt(null);
    setSaving(false);
    setError("");
  }, [open]);

  const finish = useCallback(async () => {
    toast.success("Tienda agregada");
    onClose();
    await onAdded();
  }, [onClose, onAdded]);

  /** Pide un código nuevo (también sirve de reintento tras un fallo). */
  const startCode = useCallback(
    async (username: string) => {
      setSaving(true);
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

        setHandle(username);
        setCode(data.code);
        setExpiresAt(typeof data.expiresAt === "number" ? data.expiresAt : null);
        setStep("code");
      } catch {
        setError("No pudimos conectar con el servidor. Intenta de nuevo.");
      } finally {
        setSaving(false);
      }
    },
    [api],
  );

  const submitHandle = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const normalized = normalizeHandle(input);
      if (!normalized) {
        setError("Escribe tu @ de TikTok, por ejemplo @tutienda");
        return;
      }
      await startCode(normalized);
    },
    [input, startCode],
  );

  const confirm = useCallback(async () => {
    if (!handle || !code) return;
    setSaving(true);
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

      await finish();
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }, [api, code, finish, handle]);

  const expiry = formatExpiry(expiresAt);

  const errorText = error ? <p className="text-[11px] text-[#fe2c55]">{error}</p> : null;

  return (
    <Dialog
      open={open}
      // Sin salida por fondo ni por Escape: la única salida es la X del diálogo.
      disablePointerDismissal
      onOpenChange={(next, details) => {
        if (
          !next &&
          (details.reason === "escape-key" || details.reason === "outside-press")
        ) {
          return;
        }
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar tienda</DialogTitle>
          <DialogDescription>
            {step === "handle"
              ? "Escribe el @ de TikTok de la tienda. Vamos a comprobar que la cuenta es tuya."
              : "Comprobamos que la cuenta es tuya con un código en la biografía."}
          </DialogDescription>
        </DialogHeader>

        {step === "handle" ? (
          <form onSubmit={submitHandle} className="mt-4">
            <Label
              htmlFor="add-store-handle"
              className="mb-1.5 block text-[11px] font-medium text-white/50"
            >
              @ de TikTok
            </Label>
            <Input
              id="add-store-handle"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              placeholder="@tutienda"
              autoComplete="off"
              disabled={saving}
              className="h-10 w-full rounded-xl border-white/10 bg-white/5 px-3 text-sm text-white/85 placeholder:text-white/20 focus-visible:ring-[#fe2c55]/40 disabled:opacity-50"
            />
            {errorText && <div className="mt-2">{errorText}</div>}
            <DialogFooter>
              <button
                type="submit"
                disabled={saving || !input.trim()}
                className={PRIMARY_BUTTON}
                style={{ background: "#fe2c55" }}
              >
                {saving ? "Generando código…" : "Continuar"}
              </button>
            </DialogFooter>
          </form>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-xs leading-relaxed text-white/60">
              Pega este código en la biografía de{" "}
              <span className="font-semibold text-white/85">@{handle}</span>, guarda los
              cambios y confirma acá.
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
                {code}
              </span>
              <span className="mt-1 block text-[10px] text-white/35">
                {expiry ? `Vence a las ${expiry}.` : "El código vence en unos minutos."}
              </span>
            </div>
            {errorText}
            <DialogFooter>
              <button
                type="button"
                onClick={() => void confirm()}
                disabled={saving}
                className={PRIMARY_BUTTON}
                style={{ background: "#fe2c55" }}
              >
                {saving ? "Verificando…" : "Ya pegué el código"}
              </button>
              <button
                type="button"
                onClick={() => void startCode(handle)}
                disabled={saving}
                className={SECONDARY_BUTTON}
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Generar un código nuevo
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
