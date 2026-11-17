"use client";

import { useCallback, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  CATEGORIES,
  FREQUENCIES,
  buildPayload,
  submitWaitlist,
  validateWaitlist,
  type WaitlistInput,
} from "@/lib/waitlist";

const EMPTY: WaitlistInput = {
  email: "",
  store: "",
  tiktok: "",
  category: "",
  frequency: "",
  website: "",
};

type Status = "idle" | "sending" | "invalid" | "failed" | "ok";

const fieldClass =
  "w-full h-12 px-3 rounded-xl text-sm bg-white/5 text-white/90 placeholder:text-white/25 outline-none focus:ring-2 focus:ring-[#fe2c55]/40";
const fieldStyle = { border: "1px solid rgba(255,255,255,0.10)" };
const labelClass = "block text-xs font-medium text-white/40 mb-1.5";

/** S1-S5 de `odd/tasks/waitlist.md`: captura pública, sin sesión. */
export default function WaitlistPage() {
  const { t } = useI18n();
  const [form, setForm] = useState<WaitlistInput>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");

  const update =
    (field: keyof WaitlistInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (validateWaitlist(form) !== null) {
        setStatus("invalid");
        return;
      }
      setStatus("sending");
      try {
        await submitWaitlist(buildPayload(form));
        setStatus("ok");
      } catch {
        setStatus("failed");
      }
    },
    [form],
  );

  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top, rgba(254,44,85,0.10) 0%, transparent 65%)" }}
      />
      <div className="relative max-w-xl mx-auto px-4 sm:px-6">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 tracking-wide">
          {t("waitlist.eyebrow")}
        </span>
        <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold text-white/90 tracking-tight">
          {t("waitlist.title")}
        </h1>
        <p className="mt-3 text-white/40 leading-relaxed">{t("waitlist.subtitle")}</p>

        <div
          className="mt-8 rounded-3xl p-6 sm:p-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {status === "ok" ? (
            <div role="status" className="text-center py-6">
              <p className="text-lg font-extrabold text-white/90">{t("waitlist.ok.title")}</p>
              <p className="mt-2 text-sm text-white/50">{t("waitlist.ok.body")}</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              <div>
                <label htmlFor="wl-email" className={labelClass}>
                  {t("waitlist.email")}
                </label>
                <input
                  id="wl-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  placeholder={t("waitlist.email.placeholder")}
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>

              <div>
                <label htmlFor="wl-store" className={labelClass}>
                  {t("waitlist.store")}
                </label>
                <input
                  id="wl-store"
                  name="store"
                  type="text"
                  autoComplete="organization"
                  required
                  value={form.store}
                  onChange={update("store")}
                  placeholder={t("waitlist.store.placeholder")}
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>

              <div>
                <label htmlFor="wl-tiktok" className={labelClass}>
                  {t("waitlist.tiktok")}
                </label>
                <input
                  id="wl-tiktok"
                  name="tiktok"
                  type="text"
                  required
                  maxLength={30}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={form.tiktok}
                  onChange={update("tiktok")}
                  placeholder={t("waitlist.tiktok.placeholder")}
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wl-category" className={labelClass}>
                    {t("waitlist.category")}
                  </label>
                  <select
                    id="wl-category"
                    name="category"
                    required
                    value={form.category}
                    onChange={update("category")}
                    className={fieldClass}
                    style={fieldStyle}
                  >
                    <option value="" disabled style={{ color: "#0b0f1a" }}>
                      {t("waitlist.choose")}
                    </option>
                    {/* Los valores viajan al Sheet tal cual: no se traducen. */}
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category} style={{ color: "#0b0f1a" }}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="wl-frequency" className={labelClass}>
                    {t("waitlist.frequency")}
                  </label>
                  <select
                    id="wl-frequency"
                    name="frequency"
                    required
                    value={form.frequency}
                    onChange={update("frequency")}
                    className={fieldClass}
                    style={fieldStyle}
                  >
                    <option value="" disabled style={{ color: "#0b0f1a" }}>
                      {t("waitlist.choose")}
                    </option>
                    {FREQUENCIES.map((frequency) => (
                      <option key={frequency} value={frequency} style={{ color: "#0b0f1a" }}>
                        {frequency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Honeypot: fuera de pantalla y sin foco; una persona nunca lo llena. */}
              <input
                type="text"
                name="website"
                id="wl-web"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={form.website}
                onChange={update("website")}
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
              />

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #fe2c55, #e8254a)" }}
              >
                {status === "sending" ? t("waitlist.sending") : t("waitlist.submit")}
              </button>

              <p
                role="alert"
                className="text-xs leading-relaxed"
                style={{ color: "#fe2c55", display: status === "invalid" ? "block" : "none" }}
              >
                {t("waitlist.invalid")}
              </p>
              <p
                role="alert"
                className="text-xs leading-relaxed"
                style={{ color: "#fe2c55", display: status === "failed" ? "block" : "none" }}
              >
                {t("waitlist.failed")}
              </p>

              <p className="text-[11px] text-white/25 leading-relaxed">{t("waitlist.disclaimer")}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
