"use client";

import Link from "next/link";
import ModelField from "@/components/admin/ModelField";
import ColorsField from "@/components/admin/ColorsField";
import ImagesField from "@/components/admin/ImagesField";
import { useRouter } from "next/navigation";
import { useState } from "react";

const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-ink focus:ring-1 focus:ring-ink";

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

function FileField({ label, name, accept, current, hint }) {
  const [picked, setPicked] = useState("");
  return (
    <Field label={label} hint={hint}>
      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-3 hover:border-brand/60 transition-colors">
        <input type="file" name={name} accept={accept} onChange={(e) => setPicked(e.target.files?.[0]?.name || "")} className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand hover:file:bg-orange-100" />
        {current && !picked && (
          <p className="mt-2 text-xs text-slate-500">
            Hozirgi fayl: <a href={current} target="_blank" className="text-brand underline break-all">{current}</a>
          </p>
        )}
      </div>
    </Field>
  );
}

export default function ProductForm({ categories: initialCategories, product }) {
  const router = useRouter();
  const [imageItems, setImageItems] = useState(() => {
    let list = [];
    try {
      const v = JSON.parse(product?.images || "null");
      if (Array.isArray(v)) list = v;
    } catch {}
    if (list.length === 0 && product?.imageUrl) list = [product.imageUrl];
    return list.map((url) => ({ url }));
  });
  const [stock, setStock] = useState(product?.stock || "in");
  const [categories, setCategories] = useState(initialCategories);
  const [catId, setCatId] = useState(product?.categoryId || initialCategories[0]?.id || "");
  const [newCat, setNewCat] = useState(null);
  const [catError, setCatError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const edit = Boolean(product);
  const v = (k) => product?.[k] ?? "";
  const [parts, setParts] = useState(() => {
    try {
      const p = JSON.parse(product?.colorParts || "null");
      return Array.isArray(p) && p.length ? p : null;
    } catch {
      return null;
    }
  });
  const [size, setSize] = useState({ width: v("width"), depth: v("depth"), height: v("height") });

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.delete("image");
    const files = [];
    const order = [];
    for (const it of imageItems) {
      if (it.file) {
        order.push(files.length);
        files.push(it.file);
      } else order.push(it.url);
    }
    fd.set("imageOrder", JSON.stringify(order));
    files.forEach((f) => fd.append("newImages", f));
    const res = await fetch(edit ? `/api/products/${product.id}` : "/api/products", {
      method: edit ? "PUT" : "POST",
      body: fd,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Xatolik yuz berdi");
      setLoading(false);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      {error && <p className="rounded-xl bg-red-50 text-red-600 text-sm px-4 py-3">{error}</p>}

      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold">Asosiy ma&apos;lumot</h2>
        <Field label="Nomi"><input name="name" required defaultValue={v("name")} className={input} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Kategoriya">
            <div className="space-y-2">
              <select name="categoryId" required value={catId} onChange={(e) => setCatId(e.target.value)} className={input}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {newCat === null ? (
                <button type="button" onClick={() => { setNewCat(""); setCatError(""); }} className="text-xs font-semibold text-brand hover:underline">+ Yangi kategoriya qo&apos;shish</button>
              ) : (
                <div className="flex gap-2">
                  <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Kategoriya nomi" maxLength={40} className={`${input} min-w-0 flex-1 py-2`} />
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCat }) });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) return setCatError(data.error || "Xatolik");
                      setCategories((l) => [...l, data].sort((a, b) => a.name.localeCompare(b.name)));
                      setCatId(data.id);
                      setNewCat(null);
                    }}
                    className="btn-primary px-4 text-sm"
                  >
                    Qo&apos;shish
                  </button>
                  <button type="button" onClick={() => setNewCat(null)} className="text-sm text-slate-500">Bekor</button>
                </div>
              )}
              {catError && <p className="text-xs text-red-600">{catError}</p>}
            </div>
          </Field>
          <Field label="Rang"><input name="color" defaultValue={v("color")} className={input} placeholder="Masalan: Kulrang" /></Field>
        </div>
        <Field label="Material"><input name="material" defaultValue={v("material")} className={input} placeholder="Masalan: Dub yog'ochi" /></Field>
        <Field label="Tavsif"><textarea name="description" rows={4} defaultValue={v("description")} className={input} /></Field>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold">Narx va o&apos;lcham</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Narx (so'm)"><input type="number" name="price" required min="0" defaultValue={v("price")} className={input} /></Field>
          <Field label="Eski narx (chegirma uchun)" hint="Bo'sh qoldirsangiz chegirma ko'rinmaydi"><input type="number" name="oldPrice" min="0" defaultValue={v("oldPrice")} className={input} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[["width", "Eni, sm"], ["depth", "Chuqurligi, sm"], ["height", "Balandligi, sm"]].map(([k, l]) => (
            <Field key={k} label={l}>
              <input type="number" name={k} value={size[k]} onChange={(e) => setSize({ ...size, [k]: e.target.value })} className={input} />
            </Field>
          ))}
        </div>
        <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer">
          <input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-4 w-4 accent-orange-600" />
          Bosh sahifada tavsiya etilgan (3D modeli bo&apos;lsa hero&apos;da ko&apos;rinadi)
        </label>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold">Sotuv shartlari</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Kafolat" hint="Tanlansa kartochkada 'Kafolat 2 yil' belgisi chiqadi">
            <select name="warrantyMonths" defaultValue={v("warrantyMonths")} className={input}>
              <option value="">Yo&apos;q</option>
              {[[6, "6 oy"], [12, "1 yil"], [24, "2 yil"], [36, "3 yil"], [60, "5 yil"]].map(([m, l]) => <option key={m} value={m}>{l}</option>)}
            </select>
          </Field>
          <Field label="Bo'lib to'lash (eng ko'pi bilan)" hint="Tanlansa 'oyiga ... so'm' chiqadi. Hisob-kitob oddiy bo'lish, foizsiz">
            <select name="installmentMonths" defaultValue={v("installmentMonths")} className={input}>
              <option value="">Yo&apos;q</option>
              {[3, 6, 9, 12, 18, 24].map((m) => <option key={m} value={m}>{m} oygacha</option>)}
            </select>
          </Field>
          <Field label="Mavjudlik">
            <select name="stock" value={stock} onChange={(e) => setStock(e.target.value)} className={input}>
              <option value="in">Omborda bor</option>
              <option value="order">Buyurtma bilan</option>
              <option value="out">Tugagan (sotib bo&apos;lmaydi)</option>
            </select>
          </Field>
          {stock === "order" && (
            <Field label="Tayyor bo'lish muddati (kun)">
              <input type="number" name="leadDays" min="1" defaultValue={v("leadDays")} className={input} />
            </Field>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold">Rang variantlari</h2>
        <ColorsField initial={(() => { try { return JSON.parse(product?.colors || "[]"); } catch { return []; } })()} />
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold">Rasm va 3D modellar</h2>
        <ImagesField items={imageItems} setItems={setImageItems} />
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-700">3D model (.glb)</span>
            <Link href="/admin/guide" target="_blank" className="text-xs font-semibold text-brand hover:underline">Qanday skanerlanadi?</Link>
          </div>
          {edit ? (
            <Link href={`/admin/products/${product.id}/scan`} className="mb-3 flex items-center gap-3 rounded-2xl bg-brand px-4 py-3.5 text-white transition-opacity hover:opacity-90">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.7" /></svg>
              <span>
                <span className="block text-sm font-bold">Telefon bilan 3D skanerlash</span>
                <span className="block text-xs text-white/80">Mebel atrofida aylaning — model o&apos;zi yasaladi va shu yerga qo&apos;yiladi</span>
              </span>
            </Link>
          ) : (
            <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">Telefon bilan 3D skanerlash uchun avval mahsulotni saqlang.</p>
          )}
          <input type="hidden" name="colorParts" value={parts ? JSON.stringify(parts) : ""} />
          <ModelField currentUrl={product?.glbUrl} entered={size} onDimensions={setSize} parts={parts} onParts={setParts} />
        </div>
        <FileField label="iPhone uchun .usdz (ixtiyoriy)" name="usdz" accept=".usdz" current={product?.usdzUrl} hint="Bo'sh qoldirsangiz iPhone uchun .glb dan avtomatik yasaladi. Scaniverse iPhone'da .usdz ham beradi, uni shu yerga yuklasangiz eng aniq natija bo'ladi." />

        <FileField label="Ustaxona videosi (ixtiyoriy)" name="video" accept=".mp4,.webm,.mov" current={product?.videoUrl} hint="Mahsulotni tayyorlash yoki o'rnatish jarayonining qisqa videosi. Bosh sahifadagi 'Ishlarimiz' bo'limida ko'rinadi. .mp4 tavsiya etiladi, 80 MB gacha." />
      </section>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary px-8 py-3 disabled:opacity-60">{loading ? "Saqlanmoqda..." : "Saqlash"}</button>
        <Link href="/admin/products" className="rounded-full border border-slate-300 bg-white px-6 py-3 font-medium hover:bg-slate-50">Bekor qilish</Link>
      </div>
    </form>
  );
}
