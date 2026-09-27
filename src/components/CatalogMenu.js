"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";

export default function CatalogMenu({ categories }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-neutral-700 hover:bg-background hover:text-ink transition-colors";

  return (
    <div ref={box} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`btn-primary h-11 gap-2 px-4 text-sm ${open ? "bg-[#34312d]" : ""}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          {open ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
        </svg>
        Katalog
      </button>

      {open && (
        <div className="animate-fade-up absolute left-0 top-[calc(100%+10px)] z-50 w-115 rounded-lg border border-line bg-white p-3 shadow-[0_28px_56px_-24px_rgba(23,22,20,0.35)]" style={{ animationDuration: "0.25s" }}>
          <div className="grid grid-cols-2 gap-1">
            {categories.map((c) => (
              <Link key={c.id} href={`/catalog/${c.slug}`} onClick={() => setOpen(false)} className={item}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-background text-brand">
                  <CategoryIcon slug={c.slug} size={18} />
                </span>
                <span className="min-w-0 truncate">{c.name}</span>
              </Link>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 border-t border-line pt-2 text-[13px]">
            <Link href="/catalog" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-medium text-neutral-700 hover:bg-background">Hammasi</Link>
            <Link href="/catalog?sale=1" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-medium text-accent hover:bg-red-50">Chegirmalar</Link>
            <Link href="/catalog?ar=1" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-medium text-ink hover:bg-background">3D / AR</Link>
          </div>
        </div>
      )}
    </div>
  );
}
