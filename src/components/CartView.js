"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, cartKey } from "@/lib/store";
import { useProducts } from "@/lib/useProducts";
import { formatPrice } from "@/lib/format";

export default function CartView() {
  const router = useRouter();
  const cart = useCart();
  const { products, loading } = useProducts(cart.items.map((i) => i.id));
  const [form, setForm] = useState({ name: "", phone: "+998 ", address: "", note: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = cart.items.map((i) => ({ ...i, key: cartKey(i), product: byId.get(i.id) })).filter((l) => l.product);
  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const saved = lines.reduce((s, l) => s + Math.max(0, (l.product.oldPrice || l.product.price) - l.product.price) * l.qty, 0);

  const input = "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] outline-none focus:border-ink focus:ring-1 focus:ring-ink";

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: lines.map((l) => ({ id: l.id, qty: l.qty, color: l.color || null })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Xatolik yuz berdi");
        setSending(false);
        return;
      }
      cart.clear();
      router.push(`/order/success?n=${data.id.slice(-6).toUpperCase()}`);
    } catch {
      setError("Internet aloqasini tekshiring");
      setSending(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center animate-fade-up">
        <div className="mx-auto h-24 w-24 rounded-full bg-orange-50 grid place-items-center">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M5 8h14l-1.2 11H6.2L5 8zM9 8V6a3 3 0 016 0v2" stroke="#8a5f36" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Savatcha bo&apos;sh</h1>
        <p className="mt-2 text-sm text-neutral-500">Katalogdan o&apos;zingizga yoqqan mebelni tanlang.</p>
        <Link href="/catalog" className="btn-primary inline-block mt-6 px-7 py-3.5 text-sm">Katalogga o&apos;tish</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">Savatcha</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
        <div className="space-y-3">
          {loading && cart.items.map((i) => <div key={cartKey(i)} className="skeleton h-28" />)}
          {!loading &&
            lines.map((l, idx) => (
              <div key={l.key} className="animate-fade-up flex gap-3 md:gap-4 rounded-2xl border border-neutral-200 bg-white p-3" style={{ animationDelay: `${idx * 60}ms` }}>
                <Link href={`/product/${l.id}`} className="h-24 w-24 md:h-28 md:w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  {l.product.imageUrl && <img src={l.product.imageUrl} alt="" className="h-full w-full object-cover" />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/product/${l.id}`} className="font-semibold text-sm md:text-base leading-snug line-clamp-2 hover:text-brand">{l.product.name}{l.color && <span className="block text-xs font-medium text-neutral-500">Rang: {l.color}</span>}</Link>
                    <button type="button" onClick={() => cart.remove(l.key)} aria-label="O'chirish" className="h-8 w-8 shrink-0 grid place-items-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div className="flex items-center rounded-md border border-line">
                      <button type="button" onClick={() => cart.setQty(l.key, l.qty - 1)} className="h-9 w-9 text-lg hover:text-brand" aria-label="Kamaytirish">−</button>
                      <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                      <button type="button" onClick={() => cart.setQty(l.key, l.qty + 1)} className="h-9 w-9 text-lg hover:text-brand" aria-label="Ko'paytirish">+</button>
                    </div>
                    <div className="text-right leading-tight">
                      {l.product.oldPrice && <p className="text-[11px] text-neutral-400 line-through">{formatPrice(l.product.oldPrice * l.qty)}</p>}
                      <p className="whitespace-nowrap font-semibold text-ink">{formatPrice(l.product.price * l.qty)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-neutral-200 bg-white p-5 md:p-6 lg:sticky lg:top-24 space-y-4">
          <div className="space-y-1.5 text-sm">
            {saved > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium"><span>Tejaladi</span><span>{formatPrice(saved)}</span></div>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-neutral-500">Jami</span>
              <span className="text-2xl font-semibold text-ink">{formatPrice(total)}</span>
            </div>
          </div>
          <hr className="border-neutral-100" />
          <p className="font-semibold">Buyurtma ma&apos;lumotlari</p>
          <input required autoComplete="name" placeholder="Ismingiz" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
          <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="Telefon raqam" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
          <input required autoComplete="street-address" placeholder="Yetkazib berish manzili" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input} />
          <textarea rows={2} placeholder="Izoh (ixtiyoriy)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={input} />
          {error && <p className="animate-fade-in rounded-xl bg-red-50 text-red-600 text-sm px-4 py-3">{error}</p>}
          <button type="submit" disabled={sending || loading} className="btn-primary w-full py-4 text-base disabled:opacity-60">
            {sending ? "Yuborilmoqda..." : "Buyurtma berish"}
          </button>
          <p className="text-center text-[11px] text-neutral-400">Buyurtmadan so&apos;ng operator siz bilan bog&apos;lanadi.</p>
        </form>
      </div>
    </div>
  );
}
