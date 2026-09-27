import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import OrderStatus from "@/components/admin/OrderStatus";
import DeleteButton from "@/components/admin/DeleteButton";
import CopyOrder from "@/components/admin/CopyOrder";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

  let items = [];
  try {
    items = JSON.parse(order.items);
  } catch {}

  const products = await prisma.product.findMany({ where: { id: { in: items.map((i) => i.id) } } });
  const live = new Map(products.map((p) => [p.id, p]));
  const lines = items.map((it) => {
    const p = live.get(it.id);
    let hex = it.colorHex;
    if (!hex && it.color && p?.colors) {
      try {
        hex = JSON.parse(p.colors).find((c) => c.name === it.color)?.hex;
      } catch {}
    }
    return { ...it, hex, image: it.image || p?.imageUrl || null, exists: Boolean(p) };
  });

  const number = order.id.slice(-6).toUpperCase();
  const phoneDigits = order.phone.replace(/[^\d+]/g, "");
  const summary = [
    `Buyurtma #${number}`,
    `Mijoz: ${order.name}, ${order.phone}`,
    `Manzil: ${order.address}`,
    ...(order.note ? [`Izoh: ${order.note}`] : []),
    "",
    ...lines.map((l) => `- ${l.name}${l.color ? ` (${l.color})` : ""} x${l.qty} = ${formatPrice(l.price * l.qty)}`),
    "",
    `Jami: ${formatPrice(order.total)}`,
  ].join("\n");

  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/admin/orders" className="text-sm font-medium text-slate-500 hover:text-brand">← Barcha buyurtmalar</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Buyurtma #{number}</h1>
          <p className="text-sm text-slate-500 mt-1">{order.createdAt.toLocaleString("uz-UZ")}</p>
        </div>
        <OrderStatus id={order.id} status={order.status} />
      </div>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-2.5">
        <h2 className="font-bold">Mijoz</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Ismi</dt><dd className="font-semibold text-right">{order.name}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Telefon</dt><dd className="text-right"><a href={`tel:${phoneDigits}`} className="font-semibold text-brand">{order.phone}</a></dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Manzil</dt><dd className="font-semibold text-right">{order.address}</dd></div>
          {order.note && <div className="flex justify-between gap-4"><dt className="text-slate-500">Izoh</dt><dd className="text-right italic">{order.note}</dd></div>}
        </dl>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100">
        <h2 className="font-bold p-5 pb-3">Buyurtma tarkibi</h2>
        {lines.map((l, k) => (
          <div key={k} className="flex gap-3 md:gap-4 p-4 md:p-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              {l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">
                {l.exists ? <Link href={`/product/${l.id}`} target="_blank" className="hover:text-brand">{l.name}</Link> : <>{l.name} <span className="text-xs text-slate-400">(o&apos;chirilgan)</span></>}
              </p>
              {l.color ? (
                <p className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                  <span className="h-3.5 w-3.5 rounded-full border border-slate-300" style={{ background: l.hex || "#cbd5e1" }} />
                  Rang: {l.color}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-400">Rang tanlanmagan (asl rang)</p>
              )}
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <p className="text-sm text-slate-500">{formatPrice(l.price)} x {l.qty}</p>
                <p className="font-extrabold">{formatPrice(l.price * l.qty)}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-b-2xl">
          <span className="font-semibold text-slate-600">Jami</span>
          <span className="text-2xl font-extrabold text-brand">{formatPrice(order.total)}</span>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <a href={`tel:${phoneDigits}`} className="btn-primary px-6 py-2.5 text-sm">Qo&apos;ng&apos;iroq qilish</a>
        <CopyOrder text={summary} />
        <div className="ml-auto">
          <DeleteButton url={`/api/admin/orders/${order.id}`} confirmText="Buyurtma o'chirilsinmi?" redirectTo="/admin/orders" />
        </div>
      </div>
    </div>
  );
}
