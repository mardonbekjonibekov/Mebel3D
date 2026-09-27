"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";

export default function HeroModel({ product }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3 md:p-4">
      <div className="relative overflow-hidden rounded-md bg-[#f1eee8]">
        <model-viewer suppressHydrationWarning
          src={product.glbUrl}
          ios-src={product.usdzUrl || undefined}
          alt={product.name}
          auto-rotate
          auto-rotate-delay="0"
          rotation-per-second="24deg"
          camera-controls
          disable-zoom
          shadow-intensity="1.1"
          shadow-softness="1"
          exposure="1.05"
          camera-orbit="35deg 72deg auto"
          style={{ width: "100%", height: "clamp(260px, 42vw, 400px)" }}
        />
        <span className="absolute left-3 top-3 rounded-sm bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
          Jonli 3D
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 px-1 pb-0.5 pt-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{product.name}</p>
          <p className="text-sm text-neutral-500">{formatPrice(product.price)}</p>
        </div>
        <Link href={`/product/${product.id}`} className="btn-primary shrink-0 px-4 py-2.5 text-xs">
          AR da ko&apos;rish
        </Link>
      </div>
    </div>
  );
}
