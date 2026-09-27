import { getSite } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sozlamalar" };

export default async function SettingsPage() {
  const site = await getSite();
  const { benefits, popularList, phoneHref, phone2Href, ...fields } = site;
  return (
    <>
      <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Do&apos;kon sozlamalari</h1>
      <p className="mb-6 text-sm text-slate-500">Telefon, manzil, ish vaqti va boshqa ma&apos;lumotlar saytning hamma joyida shu yerdan olinadi.</p>
      <SettingsForm initial={fields} />
    </>
  );
}
