import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminProducts({ searchParams }) {
  const { q } = await searchParams;
  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold">Mahsulotlar <span className="text-slate-400 text-lg font-semibold">{products.length}</span></h1>
        <Link href="/admin/products/new" className="btn-primary px-5 py-2.5 text-sm">+ Yangi mahsulot</Link>
      </div>

      <form className="max-w-sm">
        <input name="q" defaultValue={q || ""} placeholder="Nom bo'yicha qidirish..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-ink focus:ring-1 focus:ring-ink" />
      </form>

      <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {products.length === 0 && <p className="p-8 text-center text-sm text-slate-400">Mahsulot topilmadi</p>}
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-slate-50 transition-colors">
            <div className="h-14 w-14 md:h-16 md:w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{p.name}</p>
              <p className="text-xs text-slate-500">{p.category.name} · {formatPrice(p.price)}</p>
              <div className="mt-1 flex gap-1.5 text-[10px] font-bold">
                {p.glbUrl ? <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">GLB</span> : <span className="rounded-full bg-slate-100 text-slate-400 px-2 py-0.5">GLB yo&apos;q</span>}
                {p.usdzUrl ? <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">USDZ</span> : <span className="rounded-full bg-slate-100 text-slate-400 px-2 py-0.5">USDZ yo&apos;q</span>}
                {p.featured && <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5">Tavsiya</span>}
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-1.5 md:gap-4 shrink-0">
              <Link href={`/product/${p.id}`} target="_blank" className="text-sm text-slate-500 hover:text-slate-800">Ko&apos;rish</Link>
              <Link href={`/admin/products/${p.id}`} className="text-sm font-semibold text-brand hover:underline">Tahrirlash</Link>
              <DeleteButton url={`/api/products/${p.id}`} confirmText={`"${p.name}" o'chirilsinmi?`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
