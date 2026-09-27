"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TONES } from "@/components/BannerSlider";

const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-ink focus:ring-1 focus:ring-ink";
const TONE_LABELS = { orange: "To'q sariq", dark: "Qora", blue: "Ko'k", green: "Yashil", rose: "Qizil" };

function BannerForm({ banner, onDone, onCancel }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    if (removeImage) fd.set("removeImage", "1");
    const res = await fetch(banner ? `/api/admin/banners/${banner.id}` : "/api/admin/banners", { method: banner ? "PUT" : "POST", body: fd });
    setSaving(false);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error || "Xatolik yuz berdi");
    onDone();
  }

  return (
    <form onSubmit={submit} className="animate-fade-up space-y-3 rounded-2xl border border-brand/30 bg-white p-4 md:p-5">
      <h3 className="font-bold">{banner ? "Bannerni tahrirlash" : "Yangi banner"}</h3>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <input name="title" required defaultValue={banner?.title} placeholder="Sarlavha" maxLength={90} className={input} />
      <input name="subtitle" defaultValue={banner?.subtitle || ""} placeholder="Qisqa matn (ixtiyoriy)" maxLength={200} className={input} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="buttonText" defaultValue={banner?.buttonText || ""} placeholder="Tugma yozuvi (masalan: Ko'rish)" maxLength={30} className={input} />
        <input name="link" defaultValue={banner?.link || ""} placeholder="Havola (masalan: /catalog?sale=1)" className={input} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Rang (rasm bo&apos;lmasa)
          <select name="tone" defaultValue={banner?.tone || "orange"} className={`${input} mt-1.5 font-normal`}>
            {Object.entries(TONE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Rasm (ixtiyoriy; tavsiya: 1600 x 600 px, rasmning chap qismi matn uchun sokinroq bo&apos;lsin)
          <input type="file" name="image" accept="image/png,image/jpeg,image/webp" className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand" />
        </label>
      </div>
      {banner?.imageUrl && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} className="accent-orange-600" />
          Hozirgi rasmni olib tashlash
        </label>
      )}
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={banner ? banner.active : true} className="h-4 w-4 accent-orange-600" />
        Saytda ko&apos;rsatilsin
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-60">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium hover:bg-slate-50">Bekor qilish</button>
      </div>
    </form>
  );
}

export default function BannerManager({ banners }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  async function patch(id, body) {
    setBusy(true);
    await fetch(`/api/admin/banners/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    router.refresh();
  }
  const done = () => { setEditing(null); router.refresh(); };

  async function seed() {
    setBusy(true);
    await fetch("/api/admin/banners/seed", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold">Bannerlar <span className="text-slate-400 text-lg font-semibold">{banners.length}</span></h1>
        {editing === null && <button type="button" onClick={() => setEditing("new")} className="btn-primary px-5 py-2.5 text-sm">+ Banner qo&apos;shish</button>}
      </div>
      <p className="text-sm text-slate-500">Bosh sahifadagi katta slayder. Banner bo&apos;lmasa, sayt tayyor namuna bannerlarni ko&apos;rsatadi.</p>

      {editing === "new" && <BannerForm onDone={done} onCancel={() => setEditing(null)} />}

      <div className="space-y-3">
        {banners.length === 0 && editing !== "new" && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">Hali banner yo&apos;q. Saytda hozir namuna bannerlar ko&apos;rinyapti, ularni tahrirlab bo&apos;lmaydi.</p>
          <button type="button" disabled={busy} onClick={seed} className="btn-primary mt-4 px-6 py-2.5 text-sm disabled:opacity-60">Namuna bannerlarni tahrirlash uchun qo&apos;shish</button>
        </div>}
        {banners.map((b, i) =>
          editing === b.id ? (
            <BannerForm key={b.id} banner={b} onDone={done} onCancel={() => setEditing(null)} />
          ) : (
            <div key={b.id} className={`flex flex-col gap-3 rounded-2xl border bg-white p-3 sm:flex-row sm:items-center ${b.active ? "border-slate-200" : "border-slate-200 opacity-60"}`}>
              <div className={`relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-linear-to-br sm:w-44 ${TONES[b.tone] || TONES.orange}`}>
                {b.imageUrl && <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />}
                <span className="absolute inset-x-2 bottom-2 truncate text-xs font-bold text-white drop-shadow">{b.title}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{b.title}</p>
                <p className="truncate text-xs text-slate-500">{b.subtitle || "Matn yo'q"}</p>
                <p className="mt-1 truncate text-xs text-slate-400">{b.link ? `${b.buttonText || "Batafsil"} → ${b.link}` : "Havola yo'q"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                <div className="flex gap-1">
                  <button type="button" disabled={busy || i === 0} onClick={() => patch(b.id, { move: "up" })} aria-label="Yuqoriga" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30">↑</button>
                  <button type="button" disabled={busy || i === banners.length - 1} onClick={() => patch(b.id, { move: "down" })} aria-label="Pastga" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30">↓</button>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <button type="button" onClick={() => patch(b.id, { active: !b.active })} className="font-semibold text-slate-600 hover:underline">{b.active ? "Yashirish" : "Ko'rsatish"}</button>
                  <button type="button" onClick={() => setEditing(b.id)} className="font-semibold text-brand hover:underline">Tahrirlash</button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`"${b.title}" banneri o'chirilsinmi?`)) return;
                      await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" });
                      router.refresh();
                    }}
                    className="font-medium text-red-600 hover:underline"
                  >
                    O&apos;chirish
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
