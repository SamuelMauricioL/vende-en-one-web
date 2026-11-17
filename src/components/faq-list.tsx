"use client";

/**
 * S9 de `odd/tasks/landing-waitlist.md`: acordeón nativo, sin dependencia. El
 * marcador `+`/`–` va a la derecha. Lo usan `/kit` y `/waitlist`: no hay un
 * segundo acordeón en el repo.
 */
export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl px-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 text-[15px] font-bold text-white/90 outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55]/50 [&::-webkit-details-marker]:hidden">
            {item.question}
            <span aria-hidden="true" className="text-xl leading-none text-[#fe2c55]">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">–</span>
            </span>
          </summary>
          <p className="pb-4 text-[15px] leading-relaxed text-white/40">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
