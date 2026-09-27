"use client";

import { useFavorites } from "@/lib/store";

export default function FavoriteButton({ id, className = "" }) {
  const fav = useFavorites();
  const on = fav.has(id);

  return (
    <button
      type="button"
      aria-label={on ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        fav.toggle(id);
      }}
      className={`grid place-items-center rounded-full bg-white/95 transition-transform active:scale-90 hover:scale-105 ${className}`}
    >
      <svg key={String(on)} className={on ? "animate-pop" : ""} width="18" height="18" viewBox="0 0 24 24" fill={on ? "#a23b2e" : "none"}>
        <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" stroke={on ? "#a23b2e" : "#2b2926"} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
