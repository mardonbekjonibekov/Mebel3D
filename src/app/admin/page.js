import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, models, newOrders, orders, recent, revenue] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { glbUrl: { not: null } } }),
    prisma.order.count({ where: { status: "new" } }),
    prisma.order.count(),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "cancelled" } } }),
  ]);

  const stats = [
    { label: "Mahsulotlar", value: products, tone: "from-orange-500 to-rose-500" },
    { label: "3D modellar", value: models, tone: "from-violet-500 to-indigo-500" },
    { label: "Yangi buyurtmalar", value: newOrders, tone: "from-emerald-500 to-teal-500" },
    { label: "Jami buyurtmalar", value: orders, tone: "from-sky-500 to-blue-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold">Boshqaruv paneli</h1>
        <Link href="/admin/products/new" className="btn-primary px-5 py-2.5 text-sm">+ Yangi mahsulot</Link>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <div key={s.label} className="animate-fade-up rounded-2xl bg-white border border-slate-200 p-4 md:p-5 overflow-hidden relative" style={{ animationDelay: `${i * 70}ms` }}>
            <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-linear-to-br ${s.tone} opacity-15`} />
            <p className="text-xs md:text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-slate-900 text-white p-5 md:p-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-slate-400">Buyurtmalar summasi (bekor qilinmaganlar)</p>
          <p className="text-2xl md:text-3xl font-extrabold mt-1">{formatPrice(revenue._sum.total || 0)}</p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">So&apos;nggi buyurtmalar</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand hover:underline">Hammasi</Link>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100">
          {recent.length === 0 && <p className="p-6 text-sm text-slate-400 text-center">Hali buyurtma yo&apos;q</p>}
          {recent.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-semibold truncate">{o.name}</p>
                <p className="text-xs text-slate-500">{o.phone} · {o.createdAt.toLocaleString("uz-UZ")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">{formatPrice(o.total)}</p>
                <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[o.status]}`}>{STATUS_LABELS[o.status]}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
