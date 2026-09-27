import InfoPage from "@/components/InfoPage";
import SocialLinks from "@/components/SocialLinks";
import { getSite } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aloqa" };

const isEmbed = (u) => /^https:\/\/(www\.google\.com\/maps\/embed|yandex\.(uz|com|ru)\/map-widget)/.test(u || "");

export default async function ContactsPage() {
  const site = await getSite();
  const rows = [
    ["Telefon", <a key="p" href={site.phoneHref} className="font-medium text-ink underline underline-offset-4">{site.phone}</a>],
    site.phone2 && ["Qo'shimcha telefon", <a key="p2" href={site.phone2Href} className="font-medium text-ink underline underline-offset-4">{site.phone2}</a>],
    site.email && ["Email", <a key="e" href={`mailto:${site.email}`} className="font-semibold hover:text-brand">{site.email}</a>],
    ["Manzil", site.address],
    ["Ish vaqti", site.hours],
  ].filter(Boolean);

  return (
    <InfoPage title="Aloqa" current="/contacts">
      <dl className="divide-y divide-neutral-100 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-3.5 sm:grid-cols-[180px_1fr]">
            <dt className="text-neutral-500">{k}</dt>
            <dd className="font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <SocialLinks site={site} tone="dark" className="mt-4 [&_a]:bg-neutral-100! [&_a]:text-neutral-700! [&_a:hover]:bg-brand! [&_a:hover]:text-white!" size={16} />
      {isEmbed(site.mapUrl) ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200">
          <iframe src={site.mapUrl} title="Xarita" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-80 w-full md:h-100" />
        </div>
      ) : (
        site.mapUrl && <a href={site.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6 inline-block px-6 py-3 text-sm">Xaritada ochish</a>
      )}
    </InfoPage>
  );
}
