"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useCart, useFavorites } from "@/lib/store";

const noop = () => () => {};

export default function MobileNav({ categories, site }) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const { count } = useCart();
  const fav = useFavorites();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const link =
    "flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium text-neutral-800 hover:bg-orange-50 active:bg-orange-50";

  const drawer = (
    <div className="fixed inset-0 z-100">
      <div className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <aside className="animate-slide-right absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-100">
          <span className="font-display text-2xl text-ink">{site.name}</span>
          <button aria-label="Yopish" onClick={close} className="h-10 w-10 -mr-2 grid place-items-center rounded-full hover:bg-neutral-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <Link href="/" onClick={close} className={link}>Bosh sahifa</Link>
          <Link href="/catalog" onClick={close} className={link}>Barcha katalog</Link>
          <Link href="/favorites" onClick={close} className={link}>
            Sevimlilar
            {fav.ids.length > 0 && <span className="text-xs font-semibold text-white bg-accent rounded-full px-2 py-0.5">{fav.ids.length}</span>}
          </Link>
          <Link href="/cart" onClick={close} className={link}>
            Savatcha
            {count > 0 && <span className="text-xs font-semibold text-white bg-ink rounded-full px-2 py-0.5">{count}</span>}
          </Link>
          <Link href="/catalog?sale=1" onClick={close} className={`${link} text-accent!`}>Chegirmalar</Link>
          <Link href="/catalog?ar=1" onClick={close} className={`${link} text-brand!`}>3D / AR mebellar</Link>
          <Link href="/stylist" onClick={close} className={link}>AI interyer stilist</Link>

          <p className="px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Kategoriyalar</p>
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href={`/catalog/${c.slug}`}
              onClick={close}
              className={link}
              style={{ animation: `fade-up .4s ${80 + i * 45}ms both` }}
            >
              {c.name}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-300">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}

          <p className="px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Ma&apos;lumot</p>
          <Link href="/delivery" onClick={close} className={link}>Yetkazib berish va to&apos;lov</Link>
          <Link href="/warranty" onClick={close} className={link}>Kafolat va qaytarish</Link>
          <Link href="/faq" onClick={close} className={link}>Savol-javob</Link>
          <Link href="/about" onClick={close} className={link}>Biz haqimizda</Link>
          <Link href="/contacts" onClick={close} className={link}>Aloqa</Link>
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <a href={site.phoneHref} className="btn-primary flex items-center justify-center gap-2 py-3.5 text-sm">
            Qo&apos;ng&apos;iroq qilish: {site.phone}
          </a>
        </div>
      </aside>
    </div>
  );

  return (
    <div className="md:hidden">
      <button
        aria-label="Menyu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="h-10 w-10 grid place-items-center rounded-full hover:bg-neutral-100 active:bg-neutral-100 text-neutral-800"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {mounted && open && createPortal(drawer, document.body)}
    </div>
  );
}
