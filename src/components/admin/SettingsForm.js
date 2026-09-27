"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/store";

const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-ink focus:ring-1 focus:ring-ink";

const GROUPS = [
  { title: "Do'kon ma'lumotlari", fields: [
    ["name", "Do'kon nomi"], ["tagline", "Qisqa tavsif"], ["phone", "Telefon"], ["phone2", "Qo'shimcha telefon"], ["email", "Email"],
    ["address", "Manzil"], ["hours", "Ish vaqti"],
    ["mapUrl", "Xarita (Google Maps: Ulashish, Xaritani joylash, iframe kodini shu yerga tashlang)", "wide"],
  ] },
  { title: "Ijtimoiy tarmoqlar (https:// bilan boshlanadigan havola)", fields: [
    ["telegram", "Telegram"], ["instagram", "Instagram"], ["facebook", "Facebook"], ["youtube", "YouTube"],
  ] },
  { title: "Qidiruv", fields: [["popular", "Ko'p qidiriladigan so'zlar (vergul bilan)", "wide"]] },
  { title: "Ustunliklar (bosh sahifadagi 4 ta blok)", fields: [1, 2, 3, 4].flatMap((i) => [[`benefit${i}Title`, `${i}. Sarlavha`], [`benefit${i}Text`, `${i}. Matn`]]) },
];

export default function SettingsForm({ initial }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    setSaving(false);
    if (!res.ok) return setError("Saqlab bo'lmadi");
    toast("Saqlandi");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-6 max-w-3xl">
      {GROUPS.map((g) => (
        <section key={g.title} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <h2 className="font-bold">{g.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {g.fields.map(([key, label, wide]) => (
              <label key={key} className={`block ${wide ? "sm:col-span-2" : ""}`}>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
                <input value={values[key] || ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} className={input} maxLength={300} />
              </label>
            ))}
          </div>
        </section>
      ))}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary px-8 py-3 disabled:opacity-60">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
    </form>
  );
}
