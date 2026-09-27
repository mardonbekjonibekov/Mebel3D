"use client";

import Link from "next/link";
import { useState } from "react";
import ProductCard from "@/components/ProductCard";

export default function HomeTabs({ tabs }) {
  const visible = tabs.filter((t) => t.products.length > 0);
  const [active, setActive] = useState(visible[0]?.key);
  if (visible.length === 0) return null;
  const current = visible.find((t) => t.key === active) || visible[0];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="eyebrow">Katalog</p>
          <h2 className="mt-2 text-3xl leading-none md:text-5xl">Tanlangan mebellar</h2>
        </div>
        <Link href={current.href} className="group inline-flex items-center gap-1.5 border-b border-ink pb-0.5 text-sm font-medium text-ink">
          Barchasini ko&apos;rish
          <svg className="transition-transform group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>
      <div role="tablist" className="mt-7 flex gap-7 overflow-x-auto no-scrollbar border-b border-line">
        {visible.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={current.key === t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`-mb-px shrink-0 border-b-2 pb-3 text-sm transition-colors ${current.key === t.key ? "border-ink font-medium text-ink" : "border-transparent text-neutral-500 hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={current.key} className="animate-fade-up mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5" style={{ animationDuration: "0.4s" }}>
        {current.products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
