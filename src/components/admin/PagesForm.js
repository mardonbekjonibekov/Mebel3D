"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/store";

const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-ink focus:ring-1 focus:ring-ink";

export default function PagesForm({ initial }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/pages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    setSaving(false);
    if (res.ok) {
      toast("Saqlandi");
      router.refresh();
    }
  }

  const area = (key, label, hint) => (
    <section className="rounded-2xl bg-white border border-slate-200 p-5">
      <h2 className="font-bold">{label}</h2>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      <textarea rows={7} value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} className={`${input} mt-3`} maxLength={8000} />
    </section>
  );

  return (
    <form onSubmit={save} className="space-y-6 max-w-3xl">
      {area("about", "Biz haqimizda", "Bo'sh qatorlar abzaslarni ajratadi.")}
      {area("delivery", "Yetkazib berish va to'lov")}
      {area("warranty", "Kafolat va qaytarish")}

      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
        <h2 className="font-bold">Savol-javob</h2>
        {v.faq.map((f, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2">
            <input value={f.q} onChange={(e) => setV({ ...v, faq: v.faq.map((x, k) => (k === i ? { ...x, q: e.target.value } : x)) })} placeholder="Savol" className={input} maxLength={200} />
            <textarea rows={3} value={f.a} onChange={(e) => setV({ ...v, faq: v.faq.map((x, k) => (k === i ? { ...x, a: e.target.value } : x)) })} placeholder="Javob" className={input} maxLength={2000} />
            <button type="button" onClick={() => setV({ ...v, faq: v.faq.filter((_, k) => k !== i) })} className="text-xs font-medium text-red-600 hover:underline">Savolni o&apos;chirish</button>
          </div>
        ))}
        <button type="button" onClick={() => setV({ ...v, faq: [...v.faq, { q: "", a: "" }] })} className="text-sm font-semibold text-brand hover:underline">+ Savol qo&apos;shish</button>
      </section>

      <button type="submit" disabled={saving} className="btn-primary px-8 py-3 disabled:opacity-60">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
    </form>
  );
}
