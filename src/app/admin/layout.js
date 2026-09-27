import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { getSite } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import Toaster from "@/components/Toaster";

export const metadata = { title: "Admin panel", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }) {
  const [SITE, newOrders] = await Promise.all([getSite(), prisma.order.count({ where: { status: "new" } })]);
  return (
    <div className="flex-1 md:grid md:grid-cols-[250px_1fr] bg-slate-100 min-h-screen">
      <AdminMobileNav name={SITE.name} newOrders={newOrders} />
      <aside className="hidden md:flex md:sticky md:top-0 md:h-screen md:flex-col bg-slate-900 text-white p-4 gap-6">
        <Link href="/admin" className="flex items-center gap-2 px-1.5">
          <span className="h-8 w-8 rounded-lg bg-brand-gradient grid place-items-center text-sm font-black">M</span>
          <span className="font-extrabold">{SITE.name} <span className="text-slate-400 font-medium text-xs">admin</span></span>
        </Link>
        <AdminNav newOrders={newOrders} />
        <Link href="/" target="_blank" className="mt-auto flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2.5 text-sm text-slate-300 hover:bg-white/10">
          Saytni ko&apos;rish
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </aside>
      <main className="p-4 md:p-8 min-w-0 animate-fade-in-soft">{children}</main>
      <Toaster />
    </div>
  );
}
