"use client";

import Link from "next/link";
import { useCart, useFavorites } from "@/lib/store";

function Badge({ n, tone }) {
  if (!n) return null;
  return (
    <span
      key={n}
      className={`animate-pop absolute top-0.5 right-0 min-w-4 h-4 px-1 rounded-full text-[10px] font-semibold text-white grid place-items-center ${tone}`}
    >
      {n}
    </span>
  );
}

export default function HeaderActions() {
  const { count } = useCart();
  const fav = useFavorites();
  const btn = "relative h-10 w-10 grid place-items-center rounded-full hover:bg-black/5 active:bg-black/5 text-ink transition-colors";

  return (
    <>
      <Link href="/favorites" aria-label="Sevimlilar" className={btn}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        <Badge n={fav.ids.length} tone="bg-accent" />
      </Link>
      <Link href="/cart" aria-label="Savatcha" className={btn}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M5 8h14l-1.2 11H6.2L5 8zM9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Badge n={count} tone="bg-ink" />
      </Link>
    </>
  );
}
