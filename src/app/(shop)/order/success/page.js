import Link from "next/link";

export const metadata = { title: "Buyurtma qabul qilindi" };

export default async function SuccessPage({ searchParams }) {
  const { n } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="animate-pop mx-auto h-24 w-24 rounded-full bg-emerald-50 grid place-items-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <h1 className="animate-fade-up mt-6 text-2xl md:text-3xl font-semibold">Buyurtma qabul qilindi</h1>
      {n && <p className="animate-fade-up mt-2 text-sm text-neutral-500" style={{ animationDelay: "80ms" }}>Buyurtma raqami: <b className="text-neutral-800">#{n}</b></p>}
      <p className="animate-fade-up mt-3 text-neutral-600" style={{ animationDelay: "140ms" }}>Operatorimiz tez orada siz bilan bog&apos;lanadi.</p>
      <Link href="/catalog" className="btn-primary inline-block mt-8 px-7 py-3.5 text-sm">Xaridni davom ettirish</Link>
    </div>
  );
}
