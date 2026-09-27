import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

const DONE = ["delivered", "cancelled"];

export default async function AdminOrders({ searchParams }) {
  const archive = (await searchParams).arxiv === "1";
  const all = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  const archived = all.filter((o) => DONE.includes(o.status)).length;
  const orders = all.filter((o) => (archive ? DONE.includes(o.status) : !DONE.includes(o.status)));
  const products = await prisma.product.findMany({ select: { id: true, colors: true } });
  const hexOf = new Map();
  for (const p of products) {
    try {
      for (const c of JSON.parse(p.colors || "[]")) hexOf.set(`${p.id}|${c.name}`, c.hex);
    } catch {}
  }
  const fresh = orders.filter((o) => o.status === "new").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold">
          {archive ? "Arxiv" : "Buyurtmalar"} <span className="text-slate-400 text-lg font-semibold">{orders.length}</span>
        </h1>
        {!archive && fresh > 0 && <span className="rounded-full bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1">{fresh} ta yangi</span>}
        <Link
          href={archive ? "/admin/orders" : "/admin/orders?arxiv=1"}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand transition-colors"
        >
          {archive ? "← Faol buyurtmalar" : `Arxiv${archived ? ` (${archived})` : ""}`}
        </Link>
      </div>
      {archive && <p className="-mt-2 text-sm text-slate-500">Yetkazilgan va bekor qilingan buyurtmalar shu yerda turadi.</p>}

      {orders.length === 0 && (
        <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-12 text-center text-slate-400">{archive ? "Arxivda buyurtma yo'q" : "Faol buyurtma yo'q"}</div>
      )}

      <div className="space-y-3">
        {orders.map((o) => {
          let items = [];
          try {
            items = JSON.parse(o.items);
          } catch {}
          return (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="group block rounded-2xl bg-white border border-slate-200 p-4 md:p-5 hover:border-brand/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">
                    {o.name} <span className="text-xs font-medium text-slate-400">#{o.id.slice(-6).toUpperCase()}</span>
                  </p>
                  <p className="text-sm text-slate-500">{o.phone}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[o.status]}`}>{STATUS_LABELS[o.status]}</span>
              </div>

              <ul className="mt-3 space-y-1.5">
                {items.map((it, k) => (
                  <li key={k} className="flex items-center gap-2 text-sm">
                    {it.color && <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300" style={{ background: it.colorHex || hexOf.get(`${it.id}|${it.color}`) || "#cbd5e1" }} />}
                    <span className="min-w-0 truncate">
                      {it.name}
                      {it.color && <span className="text-slate-500"> · {it.color}</span>}
                    </span>
                    <span className="shrink-0 text-slate-400">x{it.qty}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-400">{o.createdAt.toLocaleString("uz-UZ")}</p>
                <div className="flex items-center gap-3">
                  <p className="font-extrabold">{formatPrice(o.total)}</p>
                  <span className="text-sm font-semibold text-brand group-hover:translate-x-0.5 transition-transform">Batafsil →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
