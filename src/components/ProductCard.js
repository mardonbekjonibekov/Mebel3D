import Link from "next/link";
import { formatPrice, discountPercent, installmentPrice, warrantyLabel } from "@/lib/format";
import FavoriteButton from "@/components/FavoriteButton";
import QuickAdd from "@/components/QuickAdd";
import QuickView from "@/components/QuickView";
import { parseJson } from "@/lib/recolor";

export default function ProductCard({ product }) {
  const has3d = Boolean(product.glbUrl || product.usdzUrl);
  const off = discountPercent(product.price, product.oldPrice);
  const monthly = installmentPrice(product.price, product.installmentMonths);
  const warranty = warrantyLabel(product.warrantyMonths);
  const out = product.stock === "out";

  return (
    <article className="card-lift group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className={`h-full w-full object-contain p-3 mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.04] ${out ? "opacity-60 grayscale" : ""}`}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-neutral-400">Rasm yo&apos;q</div>
          )}
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {off > 0 && <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-white">-{off}%</span>}
            {has3d && (
              <QuickView
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  glbUrl: product.glbUrl,
                  colors: parseJson(product.colors, []),
                  colorParts: parseJson(product.colorParts, null),
                }}
              />
            )}
          </div>
          {warranty && (
            <span className="absolute bottom-2.5 left-2.5 rounded-sm bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700 md:text-[11px]">
              Kafolat {warranty}
            </span>
          )}
          {out && <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-1.5 text-center text-xs font-medium text-white">Tugagan</span>}
        </div>
      </Link>

      <FavoriteButton id={product.id} className="absolute right-2.5 top-2.5 h-9 w-9" />

      <div className="flex flex-1 flex-col justify-between gap-3 p-3.5">
        <div>
          {product.category && <p className="text-[11px] uppercase tracking-widest text-neutral-400">{product.category.name}</p>}
          <Link href={`/product/${product.id}`}>
            <h3 className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-ink md:text-[15px]">{product.name}</h3>
          </Link>
          {product.stock === "order" && <p className="mt-1 text-[11px] font-medium text-amber-700">Buyurtma bilan{product.leadDays ? `, ~${product.leadDays} kun` : ""}</p>}
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 leading-tight">
            {product.oldPrice && <p className="text-[11px] text-neutral-400 line-through">{formatPrice(product.oldPrice)}</p>}
            <p className="whitespace-nowrap text-[13px] font-semibold text-ink md:text-base">{formatPrice(product.price)}</p>
            {monthly && <p className="mt-0.5 text-[10px] text-neutral-500 md:text-[11px]">oyiga {formatPrice(monthly)} x {product.installmentMonths} oy</p>}
          </div>
          {!out && <QuickAdd id={product.id} />}
        </div>
      </div>
    </article>
  );
}
