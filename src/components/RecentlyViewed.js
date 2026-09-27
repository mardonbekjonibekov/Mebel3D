"use client";

import { useRecent } from "@/lib/store";
import { useProducts } from "@/lib/useProducts";
import ProductCard from "@/components/ProductCard";

export default function RecentlyViewed({ excludeId }) {
  const { ids } = useRecent();
  const list = ids.filter((i) => i !== excludeId).slice(0, 4);
  const { products } = useProducts(list);
  const shown = list.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  if (shown.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl w-full px-4 pt-16 animate-fade-up">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Oxirgi ko&apos;rganlaringiz</h2>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {shown.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
