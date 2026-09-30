"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart, useFavorites } from "@/lib/store";

const TABS = [
  { href: "/", label: "Bosh sahifa", match: (p) => p === "/", icon: "M4 11l8-7 8 7M6 10v10h12V10" },
  { href: "/catalog", label: "Katalog", match: (p) => p.startsWith("/catalog"), icon: "M4 5h7v7H4V5zm9 0h7v7h-7V5zM4 14h7v7H4v-7zm9 0h7v7h-7v-7z" },
];

function Badge({ n }) {
  if (!n) return null;
  return <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-accent text-[10px] font-semibold text-white grid place-items-center">{n}</span>;
}

export default function MobileTabBar() {
  const pathname = usePathname();
  const { count } = useCart();
  const fav = useFavorites();

  // The product page has its own primary bottom action bar (color / qty / buy) —
  // a second fixed bar here would fight it for the same thumb-reach real estate.
  const hidden = pathname.startsWith("/product/");

  const item = "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors";

  return (
    <>
      {!hidden && <div aria-hidden className="h-[calc(60px+env(safe-area-inset-bottom))] md:hidden" />}
      {!hidden && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
          <div className="mx-auto grid max-w-6xl grid-cols-5 items-end px-1">
            {TABS.map((t) => {
              const active = t.match(pathname);
              return (
                <Link key={t.href} href={t.href} className={`${item} ${active ? "text-ink" : "text-neutral-400"}`}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none"><path d={t.icon} stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {t.label}
                </Link>
              );
            })}

            <Link href="/catalog?ar=1" aria-label="3D / AR mebellar" className={`${item} text-ink`}>
              <span className="-mt-5 grid h-11 w-11 place-items-center rounded-full bg-ink text-white shadow-[0_10px_24px_-8px_rgba(23,22,20,0.55)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 9l8-4.5M12 12L4 7.5M12 12v9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span className="mt-0.5">3D / AR</span>
            </Link>

            <Link href="/favorites" className={`${item} relative ${pathname === "/favorites" ? "text-ink" : "text-neutral-400"}`}>
              <span className="relative">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" stroke="currentColor" strokeWidth={pathname === "/favorites" ? 2 : 1.6} strokeLinejoin="round" /></svg>
                <Badge n={fav.ids.length} />
              </span>
              Sevimli
            </Link>
            <Link href="/cart" className={`${item} relative ${pathname === "/cart" ? "text-ink" : "text-neutral-400"}`}>
              <span className="relative">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none"><path d="M5 8h14l-1.2 11H6.2L5 8zM9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth={pathname === "/cart" ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
                <Badge n={count} />
              </span>
              Savat
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
