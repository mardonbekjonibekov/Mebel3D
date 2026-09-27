"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ADMIN_ITEMS } from "@/components/admin/nav-items";

const noop = () => () => {};

export default function AdminMobileNav({ name, newOrders = 0 }) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const path = usePathname();
  const active = (h) => (h === "/admin" ? path === "/admin" : path.startsWith(h));
  const current = ADMIN_ITEMS.find((i) => active(i.href) && i.href !== "/admin") || ADMIN_ITEMS[0];

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

  const drawer = (
    <div className="fixed inset-0 z-100">
      <div className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <aside className="animate-slide-right absolute right-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-slate-900 text-white shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <span className="flex items-center gap-2 font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-sm font-black">M</span>
            {name}
          </span>
          <button type="button" onClick={close} aria-label="Yopish" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {ADMIN_ITEMS.map((i, k) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={close}
              style={{ animation: `fade-up .35s ${60 + k * 35}ms both` }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${
                active(i.href) ? "bg-brand text-white shadow-lg shadow-orange-900/30" : "text-slate-300 active:bg-white/10"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d={i.d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="flex-1">{i.label}</span>
              {i.href === "/admin/orders" && newOrders > 0 && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand">{newOrders}</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link href="/" target="_blank" onClick={close} className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 active:bg-white/10">
            Saytni ko&apos;rish
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between gap-3 bg-slate-900 px-4 text-white shadow-lg shadow-black/20">
        <Link href="/admin" className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-gradient text-sm font-black">M</span>
          <span className="min-w-0 truncate text-sm font-extrabold">
            {name} <span className="font-medium text-slate-400">/ {current.label}</span>
          </span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="Menyu" aria-expanded={open} className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 active:bg-white/20">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          {newOrders > 0 && <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold">{newOrders}</span>}
        </button>
      </header>
      {mounted && open && createPortal(drawer, document.body)}
    </>
  );
}
