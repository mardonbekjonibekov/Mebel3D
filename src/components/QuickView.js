"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { formatPrice } from "@/lib/format";
import { useCart, toast } from "@/lib/store";
import { applyRecolor, captureOriginals } from "@/lib/recolor";

const noop = () => () => {};

function Modal({ product, onClose }) {
  const cart = useCart();
  const [color, setColor] = useState(null);
  const [ready, setReady] = useState(false);
  const viewer = useRef(null);
  const originals = useRef(null);
  const active = product.colors.find((c) => c.name === color) || null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const el = viewer.current;
    if (!el) return;
    const onLoad = () => {
      originals.current = captureOriginals(el);
      setReady(true);
    };
    el.addEventListener("load", onLoad);
    if (el.loaded) onLoad();
    return () => el.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (ready) applyRecolor(viewer.current, originals.current, active?.hex, product.colorParts);
  }, [ready, active, product.colorParts]);

  return (
    <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center">
      <div className="animate-fade-in absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-slide-up relative w-full max-w-lg rounded-t-xl md:rounded-lg bg-white p-4 md:p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <button type="button" onClick={onClose} aria-label="Yopish" className="absolute right-3 top-3 z-10 h-9 w-9 grid place-items-center rounded-full bg-white/90 shadow hover:bg-neutral-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <div className="rounded-md overflow-hidden bg-slate-100">
          <model-viewer suppressHydrationWarning ref={viewer} src={product.glbUrl} alt={product.name} loading="eager" auto-rotate camera-controls shadow-intensity="1.1" style={{ width: "100%", height: "min(75vw, 340px)" }} />
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium leading-snug">{product.name}</p>
            <p className="text-ink font-semibold text-lg">{formatPrice(product.price)}</p>
          </div>
        </div>
        {product.colors.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => setColor(null)} aria-label="Asl rang" className={`h-9 w-9 rounded-full border-2 ${!active ? "border-ink scale-110" : "border-neutral-200"}`} style={{ background: "conic-gradient(#c9a67e, #a23b2e, #4f5d75, #6b8f71, #c9a67e)" }} />
            {product.colors.map((c) => (
              <button key={c.name} type="button" onClick={() => setColor(c.name)} aria-label={c.name} title={c.name} className={`h-9 w-9 rounded-full border-2 transition-all ${active?.name === c.name ? "border-ink scale-110 shadow" : "border-neutral-200"}`} style={{ backgroundColor: c.hex }} />
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => { cart.add(product.id, 1, color); toast("Savatchaga qo'shildi"); }} className="btn-outline flex-1 py-3">Savatchaga</button>
          <Link href={`/product/${product.id}`} onClick={onClose} className="btn-primary flex-1 py-3 text-center">Batafsil</Link>
        </div>
      </div>
    </div>
  );
}

export default function QuickView({ product }) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        aria-label="3D da tez ko'rish"
        className="rounded-sm bg-ink/90 text-white text-[10px] md:text-[11px] font-medium tracking-wide px-2 py-1 flex items-center gap-1 transition-colors hover:bg-brand"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 2l9 4.9v10.2L12 22l-9-4.9V6.9L12 2z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /></svg>
        3D / AR
      </button>
      {mounted && open && createPortal(<Modal product={product} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
