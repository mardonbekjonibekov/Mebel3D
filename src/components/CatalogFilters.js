"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";

const field = "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink";

function Group({ title, children }) {
  return (
    <div className="border-b border-neutral-100 py-4 first:pt-0 last:border-0">
      <p className="mb-2.5 text-[13px] font-semibold text-neutral-800">{title}</p>
      {children}
    </div>
  );
}

export default function CatalogFilters({ basePath, categories, activeSlug, values, colors, materials, total }) {
  const [open, setOpen] = useState(false);
  const form = useRef(null);
  const submit = () => form.current?.requestSubmit();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    if (window.matchMedia("(max-width: 1023px)").matches) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const toggle = (name, label, checked) => (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-neutral-700 hover:text-brand">
      <input type="checkbox" name={name} value="1" defaultChecked={checked} onChange={submit} className="h-4 w-4 accent-orange-600" />
      {label}
    </label>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        Filtr
      </button>

      <div className={`${open ? "fixed inset-0 z-90 flex flex-col bg-white" : "hidden"} lg:static lg:z-auto lg:block lg:bg-transparent`}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 lg:hidden">
          <p className="font-semibold">Filtr</p>
          <button type="button" onClick={() => setOpen(false)} aria-label="Yopish" className="grid h-9 w-9 place-items-center rounded-full hover:bg-neutral-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        <form id="filters" ref={form} action={basePath} method="get" className="flex-1 overflow-y-auto px-4 pb-4 lg:overflow-visible lg:rounded-2xl lg:border lg:border-neutral-200 lg:bg-white lg:p-4">
          {values.q && <input type="hidden" name="q" value={values.q} />}
          <input type="hidden" name="sort" value={values.sort} />

          <Link href="/" className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Bosh ekranga
          </Link>

          <Group title="Kategoriya">
            <div className="space-y-0.5">
              <Link href="/catalog" className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm ${!activeSlug ? "bg-[#ede9f0] font-medium text-ink" : "text-neutral-700 hover:bg-neutral-50"}`}>
                Hammasi
              </Link>
              {categories.map((c) => (
                <Link key={c.id} href={`/catalog/${c.slug}`} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${activeSlug === c.slug ? "bg-[#ede9f0] font-medium text-ink" : "text-neutral-700 hover:bg-neutral-50"}`}>
                  <CategoryIcon slug={c.slug} size={16} />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-neutral-400">{c.count}</span>
                </Link>
              ))}
            </div>
          </Group>

          <Group title="Narx (so'm)">
            <div className="grid grid-cols-2 gap-2">
              <input name="min" type="number" min="0" step="10000" placeholder="dan" defaultValue={values.min || ""} className={field} />
              <input name="max" type="number" min="0" step="10000" placeholder="gacha" defaultValue={values.max || ""} className={field} />
            </div>
          </Group>

          {colors.length > 0 && (
            <Group title="Rang">
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <label key={c.name} title={c.name} className="cursor-pointer">
                    <input type="radio" name="color" value={c.name} defaultChecked={values.color === c.name} onChange={submit} className="peer sr-only" />
                    <span className="block h-8 w-8 rounded-full border-2 border-neutral-200 transition peer-checked:border-brand peer-checked:scale-110 peer-checked:shadow-md hover:scale-105" style={{ background: c.hex }} />
                  </label>
                ))}
              </div>
              {values.color && <p className="mt-2 text-xs text-neutral-500">Tanlangan: <b>{values.color}</b></p>}
            </Group>
          )}

          {materials.length > 0 && (
            <Group title="Material">
              <select name="material" defaultValue={values.material || ""} onChange={submit} className={field}>
                <option value="">Hammasi</option>
                {materials.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Group>
          )}

          <Group title="Qulayliklar">
            {toggle("ar", "Faqat 3D / AR", values.ar)}
            {toggle("sale", "Chegirmada", values.sale)}
            {toggle("instock", "Omborda bor", values.instock)}
            {toggle("warranty", "Kafolatli", values.warranty)}
          </Group>

          <Group title="Xonamga sig'adimi? (sm)">
            <div className="grid grid-cols-3 gap-2">
              {[["fw", "Eni"], ["fd", "Chuq."], ["fh", "Bal."]].map(([k, l]) => (
                <input key={k} name={k} type="number" min="0" placeholder={l} defaultValue={values[k] || ""} className={field} aria-label={l} />
              ))}
            </div>
          </Group>

          <div className="mt-2 flex gap-2 lg:mt-3">
            <button type="submit" className="btn-primary flex-1 py-3 text-sm">Qo&apos;llash</button>
            <Link href={basePath} className="btn-outline px-5 py-3 text-sm">Tozalash</Link>
          </div>
        </form>

        <div className="border-t border-neutral-100 p-3 lg:hidden">
          <button type="button" onClick={() => setOpen(false)} className="btn-primary w-full py-3 text-sm">Yopish ({total} ta mahsulot)</button>
        </div>
      </div>
    </>
  );
}
