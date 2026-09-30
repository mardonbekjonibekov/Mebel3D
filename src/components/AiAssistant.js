"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function ask(e) {
    e?.preventDefault();
    const q = text.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Xatolik yuz berdi");
      setResult(data);
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setText("");
    setResult(null);
    setError("");
  }

  function toggle() {
    if (open) close();
    else setOpen(true);
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={close} />}

      <button
        type="button"
        onClick={toggle}
        aria-label="AI orqali mahsulot toping"
        aria-expanded={open}
        className={`fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-ink text-white shadow-[0_14px_30px_-10px_rgba(23,22,20,0.55)] transition hover:scale-105 md:bottom-6 ${open ? "h-14 w-14 justify-center" : "h-14 pl-4 pr-5"}`}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0"><path d="M12 3a7 7 0 00-7 7c0 2 .8 3.7 2 5l-.7 3 3.2-1A7 7 0 1012 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
            <span className="whitespace-nowrap text-[13px] font-semibold">AI orqali toping</span>
          </>
        )}
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-50 flex max-h-[70vh] w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_60px_-20px_rgba(23,22,20,0.35)] md:bottom-24">
          <div className="border-b border-line bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-ink">AI yordamchi</p>
            <p className="text-xs text-neutral-500">Nima kerakligini o&apos;z so&apos;zingiz bilan yozing</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {!result && !loading && !error && (
              <p className="text-xs text-neutral-500">Masalan: &laquo;yotoqxona uchun 3 milliongacha qora divan&raquo;</p>
            )}
            {loading && <p className="text-xs text-neutral-500">Qidiryapman...</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
            {result && result.products.length === 0 && (
              <p className="text-xs text-neutral-500">
                {result.understood
                  ? "Hech narsa topilmadi. Boshqacha yozib ko'ring."
                  : "Tushunmadim. Masalan: kategoriya, rang yoki narxni aniqroq yozib ko'ring."}
              </p>
            )}
            {result && result.products.length > 0 && (
              <div className="space-y-2.5">
                {result.products.map((p) => (
                  <Link key={p.id} href={`/product/${p.id}`} className="flex items-center gap-3 rounded-xl border border-line p-2 transition-colors hover:border-ink">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{p.name}</p>
                      <p className="text-xs text-neutral-500">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                ))}
                <Link href={result.catalogHref} className="btn-outline mt-1 block w-full py-2.5 text-center text-xs">
                  Hammasini katalogda ko&apos;rish
                </Link>
              </div>
            )}
          </div>

          <form onSubmit={ask} className="flex items-center gap-2 border-t border-line p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Masalan: kichkina oshxona stoli..."
              className="h-10 flex-1 rounded-lg border border-line px-3 text-sm outline-none focus:border-ink"
            />
            <button type="submit" disabled={loading} className="btn-primary h-10 px-4 text-xs disabled:opacity-50">
              Yubor
            </button>
          </form>
        </div>
      )}
    </>
  );
}
