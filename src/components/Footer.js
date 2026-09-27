import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSite } from "@/lib/settings";
import SocialLinks from "@/components/SocialLinks";

export default async function Footer() {
  const [categories, site] = await Promise.all([prisma.category.findMany({ orderBy: { name: "asc" } }), getSite()]);
  const link = "text-sm text-neutral-400 hover:text-white transition-colors";

  return (
    <footer className="mt-20 md:mt-28 bg-ink text-neutral-300">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-3xl leading-none text-white">{site.name}</p>
          <p className="mt-3 text-sm text-neutral-400 leading-relaxed max-w-xs">{site.tagline}. Mebelni telefon kamerasi orqali o&apos;z xonangizda ko&apos;ring va o&apos;lchamini aniq bilib oling.</p>
          <SocialLinks site={site} tone="dark" className="mt-4" size={16} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500 mb-4">Xaridorlarga</p>
          <ul className="space-y-2">
            <li><Link href="/delivery" className={link}>Yetkazib berish va to&apos;lov</Link></li>
            <li><Link href="/warranty" className={link}>Kafolat va qaytarish</Link></li>
            <li><Link href="/faq" className={link}>Savol-javob</Link></li>
            <li><Link href="/about" className={link}>Biz haqimizda</Link></li>
            <li><Link href="/contacts" className={link}>Aloqa</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500 mb-4">Katalog</p>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id}><Link href={`/catalog/${c.slug}`} className={`cap inline-block ${link}`}>{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500 mb-4">Aloqa</p>
          <ul className="space-y-2 text-sm">
            <li><a href={site.phoneHref} className="font-medium text-white hover:text-brand-light">{site.phone}</a></li>
            {site.phone2 && <li><a href={site.phone2Href} className="font-medium text-white hover:text-brand-light">{site.phone2}</a></li>}
            {site.email && <li><a href={`mailto:${site.email}`} className={link}>{site.email}</a></li>}
            <li className="text-neutral-400">{site.address}</li>
            <li className="text-neutral-500">{site.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} {site.name}. Barcha huquqlar himoyalangan.
      </div>
    </footer>
  );
}
