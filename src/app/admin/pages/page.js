import { getPages } from "@/lib/settings";
import PagesForm from "@/components/admin/PagesForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sahifalar" };

export default async function PagesAdmin() {
  const pages = await getPages();
  return (
    <>
      <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Sahifa matnlari</h1>
      <p className="mb-6 text-sm text-slate-500">Saytdagi &quot;Biz haqimizda&quot;, &quot;Yetkazib berish&quot;, &quot;Kafolat&quot; sahifalari va savol-javoblar. Hozirgi matnlar namuna, o&apos;zingiznikiga almashtiring.</p>
      <PagesForm initial={pages} />
    </>
  );
}
