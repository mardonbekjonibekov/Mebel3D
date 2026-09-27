"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_ITEMS } from "@/components/admin/nav-items";

export default function AdminNav({ newOrders = 0 }) {
  const path = usePathname();
  const active = (h) => (h === "/admin" ? path === "/admin" : path.startsWith(h));

  return (
    <nav className="hidden md:flex md:flex-col gap-1">
      {ADMIN_ITEMS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
            active(i.href) ? "bg-brand text-white shadow-lg shadow-orange-900/30" : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d={i.d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="flex-1">{i.label}</span>
          {i.href === "/admin/orders" && newOrders > 0 && <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-brand">{newOrders}</span>}
        </Link>
      ))}
    </nav>
  );
}
