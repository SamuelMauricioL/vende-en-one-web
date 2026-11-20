"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/astro/react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
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
import { authHeaders } from "@/lib/api-auth";
import { demoLiveHref } from "@/lib/demo-live";
import {
  EPHEMERAL_ACCOUNTS_EVENT,
  addAccount,
  readStoredAccounts,
  removeAccount,
  writeStoredAccounts,
  type EphemeralAccount,
} from "@/lib/ephemeral-accounts";
import { maskEmail, maskName } from "@/lib/mask";
import { parseTikTokProfileUrl } from "@/lib/tiktok-url";

type Access = "checking" | "admin" | "denied" | "error";

const card = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const PRIMARY_BUTTON =
  "h-10 rounded-xl px-4 text-xs font-semibold text-white transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/60 disabled:opacity-40";

const BLINK_CSS = [
  "@keyframes ll-demo-blink{0%,100%{opacity:1}50%{opacity:.15}}",
  ".ll-demo-dot{animation:ll-demo-blink 1.1s steps(2,start) infinite}",
  "@media (prefers-reduced-motion: reduce){.ll-demo-dot{animation:none;opacity:1}}",
].join("");

function DeniedCard() {
  return (
    <section
      className="rounded-3xl p-6 text-center"
      style={{ background: "rgba(254,44,85,0.06)", border: "1px solid rgba(254,44,85,0.18)" }}
    >
      <p className="text-sm font-bold" style={{ color: "#fe2c55" }}>
        No tienes acceso
      </p>
      <p className="text-xs text-white/35 mt-1">Esta sección es solo para administradores.</p>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-white/30">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white/85 font-mono break-all">
        {value || "—"}
      </p>
    </div>
  );
}

export default function AdminPerfilPage() {
  const { userId, isLoaded, getToken } = useAuth();
  const [access, setAccess] = useState<Access>("checking");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accounts, setAccounts] = useState<EphemeralAccount[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/users/profile/${encodeURIComponent(userId)}`, {
          headers: await authHeaders(getToken),
        });
        if (cancelled) return;
        if (res.status === 403) {
          setAccess("denied");
          return;
        }
        if (!res.ok) {
          setAccess("error");
          return;
        }
        const data = (await res.json().catch(() => ({}))) as {
          profile?: { role?: unknown } | null;
        };
        if (cancelled) return;
        setAccess(data.profile?.role === "admin" ? "admin" : "denied");
      } catch {
        if (!cancelled) setAccess("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, getToken]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    const clerkUser = (window as any).Clerk?.user;
    if (!clerkUser) return;
    setName(clerkUser.fullName || clerkUser.firstName || "");
    setEmail(clerkUser.primaryEmailAddress?.emailAddress || "");
  }, [isLoaded, userId]);

  const syncAccounts = useCallback(() => {
    setAccounts(readStoredAccounts());
  }, []);

  useEffect(() => {
    syncAccounts();
    window.addEventListener(EPHEMERAL_ACCOUNTS_EVENT, syncAccounts);
    window.addEventListener("storage", syncAccounts);
    return () => {
      window.removeEventListener(EPHEMERAL_ACCOUNTS_EVENT, syncAccounts);
      window.removeEventListener("storage", syncAccounts);
    };
  }, [syncAccounts]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const username = parseTikTokProfileUrl(urlInput);
    if (!username) {
      setFormError("No es una URL de perfil de TikTok válida. Usa https://www.tiktok.com/@usuario");
      return;
    }

    const next = addAccount(accounts, username);
    if (next === accounts) {
      setFormError(`@${username} ya está en la lista`);
      return;
    }

    writeStoredAccounts(next);
    setAccounts(next);
    setUrlInput("");
    setFormError("");
    setDialogOpen(false);
    toast.success(`Cuenta temporal agregada: @${username}`);
  };

  const remove = (username: string) => {
    const next = removeAccount(accounts, username);
    writeStoredAccounts(next);
    setAccounts(next);
    toast.success(`Cuenta temporal quitada: @${username}`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0f1a" }}>
      <style>{BLINK_CSS}</style>
      <AppNav current="profile" />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 pt-8 pb-12 space-y-8">
        {access === "checking" ? (
          <p className="text-sm text-white/40 text-center py-10">Cargando…</p>
        ) : access === "denied" ? (
          <DeniedCard />
        ) : access === "error" ? (
          <section className="rounded-3xl p-6 text-center" style={card}>
            <p className="text-sm font-bold text-white/80">No pudimos verificar tu acceso</p>
            <p className="text-xs text-white/35 mt-1">Revisa tu conexión y vuelve a entrar.</p>
          </section>
        ) : (
          <>
            <div>
              <h1 className="text-lg font-extrabold text-white/90 tracking-tight">Perfil admin</h1>
              <p className="text-xs text-white/35 mt-1">
                Material temporal para demos. Nada de esta pantalla se guarda en la base de datos.
              </p>
            </div>

            <section className="rounded-3xl p-6 space-y-4" style={card}>
              <Field label="Nombre" value={maskName(name)} />
              <Field label="Correo" value={maskEmail(email)} />
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-bold text-white/80">Cuentas TikTok temporales</h2>
                <p className="text-[11px] text-white/30 mt-1">
                  Se guardan solo en este navegador. Sirven para entrar al live de esa cuenta sin
                  registrar nada.
                </p>
              </div>

              {accounts.length === 0 ? (
                <p className="rounded-3xl px-4 py-6 text-center text-xs text-white/35" style={card}>
                  Todavía no registraste ninguna cuenta temporal.
                </p>
              ) : (
                <ul className="space-y-2">
                  {accounts.map((account) => (
                    <li
                      key={account.username}
                      className="flex items-center gap-3 rounded-3xl px-4 py-3"
                      style={card}
                    >
                      <span className="min-w-0 grow">
                        <span className="block text-sm font-semibold text-white/85 truncate">
                          @{account.username}
                        </span>
                        <span className="block text-[11px] text-white/30">
                          Temporal · solo para demos
                        </span>
                      </span>
                      <a
                        href={demoLiveHref(account.username)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold text-white/85 shrink-0"
                        style={{
                          background: "rgba(254,44,85,0.12)",
                          border: "1px solid rgba(254,44,85,0.35)",
                        }}
                      >
                        <span
                          className="ll-demo-dot w-1.5 h-1.5 rounded-full"
                          style={{ background: "#fe2c55" }}
                          aria-hidden="true"
                        />
                        Ir a Live
                      </a>
                      <button
                        type="button"
                        onClick={() => remove(account.username)}
                        className="text-[11px] text-white/30 hover:text-[#fe2c55] shrink-0"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setDialogOpen(true);
                }}
                className={PRIMARY_BUTTON}
                style={{ background: "#fe2c55" }}
              >
                Agregar cuenta de TikTok
              </button>
            </section>
          </>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={(next) => (next ? undefined : setDialogOpen(false))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar cuenta temporal</DialogTitle>
            <DialogDescription>
              Pega la URL del perfil de TikTok. No se guarda en la base de datos: solo en este
              navegador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="mt-4">
            <Label
              htmlFor="ephemeral-tiktok-url"
              className="mb-1.5 block text-[11px] font-medium text-white/50"
            >
              URL del perfil de TikTok
            </Label>
            <Input
              id="ephemeral-tiktok-url"
              type="url"
              inputMode="url"
              value={urlInput}
              onChange={(event) => {
                setUrlInput(event.target.value);
                setFormError("");
              }}
              placeholder="https://www.tiktok.com/@usuario"
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full rounded-xl border-white/10 bg-white/5 px-3 text-sm text-white/85 placeholder:text-white/20 focus-visible:ring-[#fe2c55]/40"
            />
            {formError ? <p className="mt-2 text-[11px] text-[#fe2c55]">{formError}</p> : null}
            <DialogFooter>
              <button
                type="submit"
                disabled={!urlInput.trim()}
                className={PRIMARY_BUTTON}
                style={{ background: "#fe2c55" }}
              >
                Agregar cuenta
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster richColors position="bottom-center" />
    </div>
  );
}
