"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/store";
import { useProducts } from "@/lib/useProducts";
import ProductCard from "@/components/ProductCard";

export default function FavoritesView() {
  const fav = useFavorites();
  const { products, loading } = useProducts(fav.ids);
  const shown = fav.ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  if (fav.ids.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center animate-fade-up">
        <div className="mx-auto h-24 w-24 rounded-full bg-orange-50 grid place-items-center">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" stroke="#a23b2e" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Sevimlilar bo&apos;sh</h1>
        <p className="mt-2 text-sm text-neutral-500">Mahsulot ustidagi yurakchani bossangiz, shu yerga qo&apos;shiladi.</p>
        <Link href="/catalog" className="btn-primary inline-block mt-6 px-7 py-3.5 text-sm">Katalogga o&apos;tish</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">Sevimlilar</h1>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {loading
          ? fav.ids.map((id) => <div key={id} className="skeleton aspect-3/4" />)
          : shown.map((p, i) => (
              <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </div>
  );
}
