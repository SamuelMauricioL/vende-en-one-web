"use client";

import { useEffect, useState } from "react";
import type { Checklist } from "@/lib/kit/content";
import { countChecked, readKitState, writeKitState } from "@/lib/kit/storage";

interface KitChecklistProps {
  /** `a`, `b`, `c`, `d`: la llave con la que el demo guardaba el avance. */
  group: string;
  checklist: Checklist;
}

/**
 * S10 de `odd/tasks/kit-live-sin-improvisar.md`: checklist con contador y barra.
 * El avance se guarda con la misma llave que el demo, así que quien ya lo había
 * empezado lo recupera.
 */
export function KitChecklist({ group, checklist }: KitChecklistProps) {
  const total = checklist.items.length;
  const [checked, setChecked] = useState<boolean[]>(() => new Array(total).fill(false));

  // Se lee después de montar: el HTML del servidor no puede saber qué marcó
  // este navegador y leerlo antes rompería la hidratación.
  useEffect(() => {
    const saved = readKitState().checks[group];
    if (!saved) return;
    setChecked(new Array(total).fill(false).map((_, index) => saved[index] === true));
  }, [group, total]);

  const toggle = (index: number) => {
    const next = checked.map((value, position) => (position === index ? !value : value));
    setChecked(next);
    const state = readKitState();
    writeKitState({ ...state, checks: { ...state.checks, [group]: next } });
  };

  const done = countChecked(checked);
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div
      className="rounded-3xl p-6"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white/90">{checklist.title}</h3>
        <span className="font-mono text-xs text-white/40 tabular-nums">
          {done}/{total}
        </span>
      </div>

      <div
        className="mt-3 h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={checklist.title}
      >
        <span
          className="block h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, background: "linear-gradient(135deg, #fe2c55, #e8254a)" }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {checklist.items.map((item, index) => (
          <li key={item.text}>
            <label
              className="flex items-start gap-3 rounded-xl px-3.5 py-3 text-[15px] cursor-pointer transition-colors duration-200 hover:bg-white/[0.03]"
              style={{ background: "rgba(11,15,26,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <input
                type="checkbox"
                checked={checked[index]}
                onChange={() => toggle(index)}
                className="mt-0.5 w-[22px] h-[22px] shrink-0 rounded accent-[#fe2c55]"
              />
              <span className={checked[index] ? "text-white/35 line-through" : "text-white/80"}>
                {item.label ? <b className="font-bold text-white/90">{item.label} </b> : null}
                {item.text}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
