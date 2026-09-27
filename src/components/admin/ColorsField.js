"use client";

import { useState } from "react";

const PRESETS = [
  ["Oq", "#f1efe9"],
  ["Qora", "#1f1f21"],
  ["Jigarrang", "#7a4b2a"],
  ["Kulrang", "#8b9096"],
  ["Bej", "#d6c3a3"],
  ["Eman", "#a67c52"],
  ["Yong'oq", "#5c3d2e"],
  ["Ko'k", "#2f4a7a"],
  ["Yashil", "#3f6b5c"],
  ["Qizil", "#a3262a"],
];

export default function ColorsField({ initial }) {
  const [list, setList] = useState(initial || []);
  const inputCls = "rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-ink focus:ring-1 focus:ring-ink";

  const add = (name = "", hex = "#8b9096") => setList((l) => (l.length >= 12 ? l : [...l, { name, hex }]));
  const update = (i, patch) => setList((l) => l.map((c, k) => (k === i ? { ...c, ...patch } : c)));

  return (
    <div className="space-y-3">
      <input type="hidden" name="colors" value={JSON.stringify(list)} />

      <div className="flex flex-wrap gap-2">
        {PRESETS.map(([n, h]) => (
          <button
            key={n}
            type="button"
            onClick={() => !list.some((c) => c.name === n) && add(n, h)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium hover:border-brand transition-colors"
          >
            <span className="h-3.5 w-3.5 rounded-full border border-slate-300" style={{ background: h }} />
            {n}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="color" value={c.hex} onChange={(e) => update(i, { hex: e.target.value })} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1" aria-label="Rang tanlash" />
            <input value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Rang nomi" maxLength={30} className={`${inputCls} min-w-0 flex-1`} />
            <button type="button" onClick={() => setList((l) => l.filter((_, k) => k !== i))} className="h-10 w-10 shrink-0 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="O'chirish">
              &times;
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => add()} className="text-sm font-semibold text-brand hover:underline">
        + Rang qo&apos;shish
      </button>
      <p className="text-xs text-slate-400">Mijoz rang doirasini bosganda 3D modelning hammasi shu rangga o&apos;tadi (bir xil rangda bo&apos;yaladi). Kamida bitta rang bo&apos;lsa, doiralar ko&apos;rinadi.</p>
    </div>
  );
}
