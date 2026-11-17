"use client";

import { useCallback, useState } from "react";
import {
  CATEGORIES,
  FREQUENCIES,
  buildPayload,
  submitWaitlist,
  validateWaitlist,
  type WaitlistInput,
} from "@/lib/waitlist";
import type { WaitlistLandingContent } from "@/lib/waitlist-landing/content";
import { card, monoLabel, primaryButton, primaryStyle } from "@/components/waitlist-landing/landing-ui";

type Copy = WaitlistLandingContent["waitlist"];

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
  "w-full h-12 px-3 rounded-xl text-sm bg-white/5 text-white/90 placeholder:text-white/25 outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/40";
const fieldStyle = { border: "1px solid rgba(255,255,255,0.10)" };
const labelClass = "block text-xs font-medium text-white/40 mb-1.5";
const errorClass = "text-xs leading-relaxed";

export function WaitlistForm({ copy }: { copy: Copy }) {
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
    <div id="waitlist" className="rounded-3xl p-6 sm:p-8 scroll-mt-24" style={card}>
      <span className={monoLabel}>{copy.eyebrow}</span>
      <h2 className="mt-3.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white/90">
        {copy.title}
      </h2>
      <p className="mt-3 leading-relaxed text-white/40">{copy.lead}</p>

      {status === "ok" ? (
        <div role="status" className="mt-6 rounded-2xl px-4 py-5" style={card}>
          <p className="text-[15px] font-bold text-white/90">{copy.ok.title}</p>
          <p className="mt-1 text-sm text-white/40">{copy.ok.body}</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="wl-email" className={labelClass}>
              {copy.fields.email.label}
            </label>
            <input
              id="wl-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={update("email")}
              placeholder={copy.fields.email.placeholder}
              className={fieldClass}
              style={fieldStyle}
            />
          </div>

          <div>
            <label htmlFor="wl-store" className={labelClass}>
              {copy.fields.store.label}
            </label>
            <input
              id="wl-store"
              name="store"
              type="text"
              autoComplete="organization"
              required
              value={form.store}
              onChange={update("store")}
              placeholder={copy.fields.store.placeholder}
              className={fieldClass}
              style={fieldStyle}
            />
          </div>

          <div>
            <label htmlFor="wl-tiktok" className={labelClass}>
              {copy.fields.tiktok.label}
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
              placeholder={copy.fields.tiktok.placeholder}
              className={fieldClass}
              style={fieldStyle}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wl-category" className={labelClass}>
                {copy.fields.category.label}
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
                  {copy.fields.category.placeholder}
                </option>
                {}
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} style={{ color: "#0b0f1a" }}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="wl-frequency" className={labelClass}>
                {copy.fields.frequency.label}
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
                  {copy.fields.frequency.placeholder}
                </option>
                {FREQUENCIES.map((frequency) => (
                  <option key={frequency} value={frequency} style={{ color: "#0b0f1a" }}>
                    {frequency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {}
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
            className={`${primaryButton} w-full disabled:opacity-40`}
            style={primaryStyle}
          >
            {status === "sending" ? copy.submitting : copy.submit}
          </button>

          <p
            role="alert"
            className={errorClass}
            style={{ color: "#fe2c55", display: status === "invalid" ? "block" : "none" }}
          >
            {copy.invalid}
          </p>
          <p
            role="alert"
            className={errorClass}
            style={{ color: "#fe2c55", display: status === "failed" ? "block" : "none" }}
          >
            {copy.failed}
          </p>

          <p className="text-[11px] text-white/25 leading-relaxed">{copy.disclaimer}</p>
        </form>
      )}
    </div>
  );
}
