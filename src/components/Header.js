import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSite } from "@/lib/settings";
import MobileNav from "@/components/MobileNav";
import HeaderActions from "@/components/HeaderActions";
import CatalogMenu from "@/components/CatalogMenu";
import SocialLinks from "@/components/SocialLinks";

function SearchForm({ className = "", popular = [] }) {
  return (
    <form action="/catalog" method="get" role="search" className={`group relative ${className}`}>
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Mebel qidirish: divan, stol, shkaf..."
        className="h-11 w-full rounded-md bg-white border border-line pl-10 pr-24 text-sm outline-none transition placeholder:text-neutral-400 focus:border-ink"
      />
      <button type="submit" className="btn-primary absolute right-1 top-1 hidden h-9 px-4 text-xs md:inline-flex">Qidirish</button>
      {popular.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 hidden rounded-lg border border-line bg-white p-4 shadow-[0_24px_48px_-24px_rgba(23,22,20,0.3)] group-focus-within:block">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Ko&apos;p qidiriladi</p>
          <div className="flex flex-wrap gap-2">
            {popular.map((w) => (
              <Link key={w} href={`/catalog?q=${encodeURIComponent(w)}`} className="rounded-md border border-line px-3 py-1.5 text-sm text-neutral-700 hover:border-ink hover:text-ink">{w}</Link>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}

export default async function Header() {
  const [categories, site] = await Promise.all([prisma.category.findMany({ orderBy: { name: "asc" } }), getSite()]);

  return (
    <>
      <div className="hidden md:block bg-ink text-neutral-400 text-[12px]">
        <div className="mx-auto max-w-6xl px-4 h-9 flex items-center justify-between gap-6">
          <div className="flex items-center gap-5 min-w-0">
            {[["/about", "Biz haqimizda"], ["/delivery", "Yetkazib berish"], ["/warranty", "Kafolat"], ["/faq", "Savol-javob"], ["/contacts", "Aloqa"]].map(([href, label]) => (
              <Link key={href} href={href} className="whitespace-nowrap hover:text-white transition-colors">{label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <a href={site.phoneHref} className="font-medium text-white hover:text-brand-light">{site.phone}</a>
            {site.phone2 && <a href={site.phone2Href} className="font-medium text-white hover:text-brand-light">{site.phone2}</a>}
            <SocialLinks site={site} tone="dark" size={14} />
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 h-16 md:h-18 flex items-center gap-3 md:gap-5">
          <Link href="/" className="shrink-0 font-display text-[1.65rem] leading-none tracking-tight text-ink">
            {site.name}
          </Link>

          <CatalogMenu categories={categories} />
          <SearchForm className="hidden md:block flex-1" popular={site.popularList} />

          <div className="ml-auto md:ml-0 flex items-center gap-1">
            <HeaderActions />
            <MobileNav categories={categories} site={site} />
          </div>
        </div>
        <div className="md:hidden px-4 pb-3">
          <SearchForm popular={site.popularList} />
        </div>
      </header>

      <nav className="hidden md:block border-b border-line bg-background">
        <div className="mx-auto max-w-6xl px-4 h-11 flex items-center gap-7 overflow-x-auto no-scrollbar text-[13px] text-neutral-600">
          {categories.map((c) => (
            <Link key={c.id} href={`/catalog/${c.slug}`} className="cap relative inline-block whitespace-nowrap py-3 transition-colors hover:text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform hover:after:scale-x-100">{c.name}</Link>
          ))}
          <span className="ml-auto h-4 w-px bg-line" />
          <Link href="/catalog?sale=1" className="whitespace-nowrap py-3 font-medium text-accent hover:opacity-80">Chegirmalar</Link>
          <Link href="/catalog?ar=1" className="whitespace-nowrap py-3 font-medium text-ink hover:text-brand">3D / AR</Link>
          <Link href="/stylist" className="whitespace-nowrap py-3 font-medium text-ink hover:text-brand">AI Stilist</Link>
        </div>
      </nav>
    </>
  );
}
