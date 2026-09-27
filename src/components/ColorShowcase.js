"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { applyRecolor, captureOriginals } from "@/lib/recolor";

export default function ColorShowcase({ items }) {
  const [idx, setIdx] = useState(0);
  const [color, setColor] = useState(null);
  const [ready, setReady] = useState(false);
  const viewer = useRef(null);
  const originals = useRef(null);
  const item = items[idx];
  const active = item.colors.find((c) => c.name === color) || null;

  useEffect(() => {
    const el = viewer.current;
    if (!el) return;
    const onLoad = () => {
      originals.current = captureOriginals(el);
      setReady(true);
    };
    el.addEventListener("load", onLoad);
    if (el.loaded) onLoad();
    return () => {
      el.removeEventListener("load", onLoad);
      setReady(false);
    };
  }, [idx]);

  useEffect(() => {
    if (ready) applyRecolor(viewer.current, originals.current, active?.hex, item.colorParts);
  }, [ready, active, item.colorParts]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-white">
      <div className="relative grid gap-8 p-4 md:grid-cols-[1.2fr_1fr] md:gap-12 md:p-10 md:items-center">
        <div className="overflow-hidden rounded-md bg-[#f1eee8]">
          <model-viewer suppressHydrationWarning
            key={item.id}
            ref={viewer}
            src={item.glbUrl}
            alt={item.name}
            loading="eager"
            auto-rotate
            camera-controls
            disable-zoom
            shadow-intensity="1.2"
            camera-orbit="30deg 72deg auto"
            style={{ width: "100%", height: "clamp(280px, 48vw, 460px)" }}
          />
        </div>

        <div>
          <p className="eyebrow">Jonli rang tanlash</p>
          <h2 className="mt-3 text-3xl leading-[1.1] md:text-5xl">Rangni o&apos;zingiz tanlang</h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600 md:text-base">Doirachani bossangiz mebel darhol shu rangga bo&apos;yaladi. Sotib olishdan oldin xonangizga mos rangni toping.</p>

          <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            {items.map((it, i) => (
              <button
                key={it.id}
                type="button"
                onClick={() => { setIdx(i); setColor(null); }}
                className={`shrink-0 h-16 w-16 overflow-hidden rounded-md border transition-all ${i === idx ? "border-ink ring-1 ring-ink" : "border-line opacity-70 hover:opacity-100"}`}
                aria-label={it.name}
              >
                {it.imageUrl && <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />}
              </button>
            ))}
          </div>

          <p className="mt-6 font-medium text-ink">{item.name}</p>
          <p className="text-lg text-neutral-600">{formatPrice(item.price)}</p>

          <p className="mt-5 text-sm text-neutral-500">Rang: <span className="font-medium text-ink">{active ? active.name : "Asl rang"}</span></p>
          <div className="mt-2 flex flex-wrap gap-2.5">
            <button type="button" onClick={() => setColor(null)} aria-label="Asl rang" className={`h-10 w-10 rounded-full border-2 transition-all ${!active ? "border-ink scale-110" : "border-transparent ring-1 ring-line hover:scale-105"}`} style={{ background: "conic-gradient(#c9a67e, #a23b2e, #4f5d75, #6b8f71, #c9a67e)" }} />
            {item.colors.map((c) => (
              <button key={c.name} type="button" onClick={() => setColor(c.name)} aria-label={c.name} title={c.name} className={`h-10 w-10 rounded-full border-2 transition-all ${active?.name === c.name ? "border-ink scale-110" : "border-transparent ring-1 ring-line hover:scale-105"}`} style={{ backgroundColor: c.hex }} />
            ))}
          </div>

          <Link href={`/product/${item.id}`} className="btn-primary mt-7 px-7 py-3.5 text-sm">Mahsulotni ochish</Link>
        </div>
      </div>
    </div>
  );
}
