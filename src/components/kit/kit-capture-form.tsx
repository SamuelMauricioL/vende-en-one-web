"use client";

import { useCallback, useRef, useState } from "react";
import type { KitContent } from "@/lib/kit/content";
import {
  CATEGORIES,
  buildPayload,
  submitLeadMagnet,
  validateLeadMagnet,
  type LeadMagnetInput,
} from "@/lib/kit/lead-magnet";

type Form = KitContent["form"];

type Status = "idle" | "sending" | "invalid" | "failed" | "ok";

const fieldClass =
  "w-full h-12 px-3 rounded-xl bg-[#0b0f1a] border-white/10 text-white/90 placeholder:text-white/25 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/50 border";
const labelClass = "block text-sm font-semibold text-white/80 mb-1.5";

interface KitCaptureFormProps {
  form: Form;
  /** Lo llama un 201: la página guarda el desbloqueo y refresca las plantillas. */
  onUnlocked: () => void;
}

/** S5/S6: captura del kit. Valida y envía con `lib/kit/lead-magnet`, nada más. */
export function KitCaptureForm({ form, onUnlocked }: KitCaptureFormProps) {
  const [values, setValues] = useState<LeadMagnetInput>(() => ({
    email: "",
    tiktok: "",
    category: CATEGORIES[0],
    website: "",
  }));
  const [status, setStatus] = useState<Status>("idle");
  const emailRef = useRef<HTMLInputElement>(null);
  const tiktokRef = useRef<HTMLInputElement>(null);

  const update =
    (field: keyof LeadMagnetInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (validateLeadMagnet(values) !== null) {
        const emailInvalid =
          validateLeadMagnet({ email: values.email, tiktok: "", category: CATEGORIES[0] }) !== null;
        (emailInvalid ? emailRef : tiktokRef).current?.focus();
        setStatus("invalid");
        return;
      }
      setStatus("sending");
      try {
        await submitLeadMagnet(buildPayload(values));
        setStatus("ok");
        onUnlocked();
      } catch {
        setStatus("failed");
      }
    },
    [values, onUnlocked],
  );

  const sending = status === "sending";
  // La regla del correo se aísla con el mismo validador: repetir la regex acá
  // sería una segunda fuente de verdad.
  const emailRejected =
    validateLeadMagnet({ email: values.email, tiktok: "", category: CATEGORIES[0] }) !== null;
  const tiktokRejected =
    !emailRejected &&
    validateLeadMagnet({ email: values.email, tiktok: values.tiktok, category: CATEGORIES[0] }) !== null;

  return (
    <div
      id="captura"
      className="rounded-3xl p-6 sm:p-8 scroll-mt-24"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <h2 className="text-xl font-extrabold text-white/90 tracking-tight">{form.title}</h2>
      <p className="mt-1.5 text-sm text-white/40 leading-relaxed">{form.subtitle}</p>

      <form onSubmit={submit} noValidate className="mt-5 space-y-4">
        <div>
          <label htmlFor="kit-email" className={labelClass}>
            {form.email}
          </label>
          <input
            id="kit-email"
            ref={emailRef}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={update("email")}
            placeholder={form.emailPlaceholder}
            aria-invalid={status === "invalid" && emailRejected}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="kit-tiktok" className={labelClass}>
            {form.tiktok}
          </label>
          <input
            id="kit-tiktok"
            ref={tiktokRef}
            name="tiktok"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={25}
            value={values.tiktok}
            onChange={update("tiktok")}
            placeholder={form.tiktokPlaceholder}
            aria-invalid={status === "invalid" && !emailRejected}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="kit-category" className={labelClass}>
            {form.category}
          </label>
          <select
            id="kit-category"
            name="category"
            value={values.category}
            onChange={update("category")}
            className={fieldClass}
          >
            {/* Se muestra el rubro traducido y se envía el canónico del API. */}
            {form.categories.map((label, index) => (
              <option key={label} value={CATEGORIES[index] ?? label} style={{ color: "#0b0f1a" }}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Honeypot: fuera de pantalla y sin foco; una persona nunca lo llena. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={values.website}
          onChange={update("website")}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        />

        <button
          type="submit"
          disabled={sending}
          className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-[#25f4ee]/60"
          style={{ background: "linear-gradient(135deg, #fe2c55, #e8254a)" }}
        >
          {sending ? form.status.submitting : form.submit}
        </button>

        {status === "ok" ? (
          <p role="status" className="text-xs leading-relaxed text-[#25f4ee]">
            {form.ok}
          </p>
        ) : null}
        {status === "invalid" ? (
          <p role="alert" className="text-xs leading-relaxed text-[#fe2c55]">
            {tiktokRejected ? form.status.invalidTiktok : form.status.invalidEmail}
          </p>
        ) : null}
        {status === "failed" ? (
          <p role="alert" className="text-xs leading-relaxed text-[#fe2c55]">
            {form.status.failed}
          </p>
        ) : null}

        <p className="text-[11px] text-white/25 leading-relaxed">{form.privacy}</p>
      </form>
    </div>
  );
}
