import Link from "next/link";
import SortSelect from "@/components/SortSelect";
import { prisma } from "@/lib/prisma";
import { queryProducts, parseFilters } from "@/lib/queries";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import Reveal from "@/components/Reveal";
import { parseJson } from "@/lib/recolor";

const CHIP_LABELS = {
  q: (v) => `Qidiruv: ${v}`, min: (v) => `Narx dan ${v}`, max: (v) => `Narx gacha ${v}`, color: (v) => `Rang: ${v}`, material: (v) => v,
  ar: () => "3D / AR", sale: () => "Chegirmada", instock: () => "Omborda bor", warranty: () => "Kafolatli",
  fw: (v) => `Eni ${v} sm gacha`, fd: (v) => `Chuqurligi ${v} sm gacha`, fh: (v) => `Balandligi ${v} sm gacha`,
};

export default async function CatalogView({ category, searchParams }) {
  const filters = parseFilters(searchParams);
  const [cats, products, facetRows] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } }),
    queryProducts({ categorySlug: category?.slug, ...filters }),
    prisma.product.findMany({ select: { colors: true, material: true } }),
  ]);
  const categories = cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: c._count.products }));
  const basePath = category ? `/catalog/${category.slug}` : "/catalog";

  const colorMap = new Map();
  const materialSet = new Set();
  for (const r of facetRows) {
    for (const c of parseJson(r.colors, [])) if (c?.name && !colorMap.has(c.name)) colorMap.set(c.name, c.hex);
    if (r.material) materialSet.add(r.material);
  }
  const colors = [...colorMap].map(([name, hex]) => ({ name, hex }));
  const materials = [...materialSet].sort();

  const raw = Object.fromEntries(Object.entries(searchParams).filter(([k, v]) => k in CHIP_LABELS && v));
  const chips = Object.entries(raw).map(([k, v]) => {
    const rest = new URLSearchParams(Object.fromEntries(Object.entries(searchParams).filter(([kk, vv]) => kk !== k && vv)));
    return { key: k, label: CHIP_LABELS[k](v), href: `${basePath}${rest.toString() ? `?${rest}` : ""}` };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <nav className="mb-2 flex gap-1.5 text-xs text-neutral-400">
        <Link href="/" className="hover:text-brand">Bosh sahifa</Link>/<span className="text-neutral-600">{category ? category.name : "Katalog"}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">{category ? category.name : "Barcha mebellar"}</h1>
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline text-sm text-neutral-400">{products.length} ta mahsulot</span>
          <SortSelect value={filters.sort} />
        </div>
      </div>
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <Link key={c.key} href={c.href} className="flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-ink">
              {c.label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
            </Link>
          ))}
          <Link href={basePath} className="text-xs font-semibold text-neutral-500 underline">Hammasini tozalash</Link>
        </div>
      )}
      <div className="mt-5 grid gap-6 lg:grid-cols-[270px_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <CatalogFilters basePath={basePath} categories={categories} activeSlug={category?.slug} values={filters} colors={colors} materials={materials} total={products.length} />
        </aside>

        <div>
          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
              <p className="text-lg font-semibold">Hech narsa topilmadi</p>
              <p className="mt-1 text-sm text-neutral-500">Filtrlarni o&apos;zgartirib ko&apos;ring.</p>
              <Link href={basePath} className="btn-primary mt-5 inline-block px-6 py-3 text-sm">Filtrlarni tozalash</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {products.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 60} className="h-full">
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
