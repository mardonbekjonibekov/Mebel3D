import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSite, getPages } from "@/lib/settings";
import CategoryIcon from "@/components/CategoryIcon";
import Reveal from "@/components/Reveal";
import BannerSlider from "@/components/BannerSlider";
import WorkshopVideos from "@/components/WorkshopVideos";
import HomeTabs from "@/components/HomeTabs";
import ColorShowcase from "@/components/ColorShowcase";
import HeroModel from "@/components/HeroModel";
import Counter from "@/components/Counter";
import RecentlyViewed from "@/components/RecentlyViewed";
import { parseJson } from "@/lib/recolor";
import { DEFAULT_BANNERS } from "@/lib/defaultBanners";

export const dynamic = "force-dynamic";

const STEPS = [
  { title: "Mebelni tanlang", text: "Katalogdan kerakli mahsulotni toping va 3D formatda har tomondan aylantirib ko'ring." },
  { title: "AR tugmasini bosing", text: "Telefon kamerasi ochiladi. Xonangizning polini kamera bilan ko'rsating." },
  { title: "Xonada sinab ko'ring", text: "Mebel haqiqiy o'lchamda xonangizda paydo bo'ladi. Joylashtiring, aylantiring, qaror qiling." },
];

const CATEGORY_BLURB = {
  divanlar: "Mehmonxona uchun yumshoq divan va kreslolar.",
  krevatlar: "Yotoqxona uchun qulay va mustahkam krevatlar.",
  "ofis-mebeli": "Ish stoli, kreslo va hujjat shkaflari.",
  shkaflar: "Kiyim va buyumlar uchun keng sig'imli shkaflar.",
  stollar: "Oshxona va mehmonxona uchun turli o'lchamdagi stollar.",
  stullar: "Har qanday stolga mos zamonaviy stullar.",
};

const BENEFIT_ICONS = [
  "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zm-3 9l2 2 4-4",
  "M3 7h11v9H3V7zm11 3h4l3 3v3h-7V10zM7 19a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z",
  "M3 6h18v12H3V6zm0 4h18M7 15h3",
  "M12 2l9 4.9v10.2L12 22l-9-4.9V6.9L12 2zM12 12l9-5M12 12L3 7M12 12v10",
];

export default async function Home() {
  const inc = { category: true };
  const [site, pages, categories, banners, popular, latest, sale, showcaseRaw, counts, videosRaw] = await Promise.all([
    getSite(),
    getPages(),
    prisma.category.findMany({ orderBy: { name: "asc" }, include: { products: { take: 1, orderBy: { createdAt: "asc" } } } }),
    prisma.banner.findMany({ where: { active: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    prisma.product.findMany({ orderBy: [{ featured: "desc" }, { createdAt: "desc" }], take: 8, include: inc }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: inc }),
    prisma.product.findMany({ where: { oldPrice: { not: null } }, orderBy: { createdAt: "desc" }, take: 8, include: inc }),
    prisma.product.findMany({ where: { glbUrl: { not: null } }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], take: 6 }),
    Promise.all([prisma.product.count(), prisma.product.count({ where: { glbUrl: { not: null } } }), prisma.category.count()]),
    prisma.product.findMany({ where: { videoUrl: { not: null } }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, videoUrl: true, imageUrl: true, price: true } }),
  ]);
  const hero = showcaseRaw[0];
  const [productCount, modelCount, categoryCount] = counts;

  const slides = banners.length ? banners : DEFAULT_BANNERS;
  const showcase = (showcaseRaw.length > 1 ? showcaseRaw.slice(1) : showcaseRaw).map((p) => ({
    id: p.id, name: p.name, price: p.price, glbUrl: p.glbUrl, imageUrl: p.imageUrl,
    colors: parseJson(p.colors, []), colorParts: parseJson(p.colorParts, null),
  }));

  const wrap = "mx-auto max-w-6xl w-full px-4";
  const section = `${wrap} pt-16 md:pt-24`;

  return (
    <div className="flex flex-col">
      <section className={`${wrap} pt-4 md:pt-6`}>
        <BannerSlider banners={slides} />
      </section>

      {/* 3D HERO */}
      {hero && (
          <section className={`${wrap} pt-4 md:pt-6`}>
            <div className="overflow-hidden rounded-lg bg-slate-100">
              <div className="grid gap-10 p-6 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-14 md:p-14">
                <div>
                  <p className="eyebrow animate-fade-up">3D / AR mebel katalogi</p>
                  <h1 className="animate-fade-up mt-4 text-[2.5rem] leading-[1.04] text-ink md:text-[4rem]" style={{ animationDelay: "80ms" }}>
                    Mebelni uyingizda <em className="font-normal text-brand">oldindan</em> ko&apos;ring
                  </h1>
                  <p className="animate-fade-up mt-5 max-w-md text-[15px] leading-relaxed text-neutral-600 md:text-base" style={{ animationDelay: "160ms" }}>
                    Har bir mahsulotni 3D aylantirib ko&apos;ring, telefon kamerasi orqali xonangizga qo&apos;ying va o&apos;lchamini aniq baholang.
                  </p>
                  <div className="animate-fade-up mt-8 grid grid-cols-2 gap-3 sm:flex" style={{ animationDelay: "240ms" }}>
                    <Link href="/catalog" className="btn-primary px-4 py-3.5 text-sm sm:px-7">Katalogni ochish</Link>
                    <Link href="/catalog?ar=1" className="btn-outline px-4 py-3.5 text-sm sm:px-7">Faqat 3D / AR</Link>
                  </div>
                  <dl className="animate-fade-up mt-10 grid max-w-md grid-cols-3 border-t border-ink/15 pt-6" style={{ animationDelay: "320ms" }}>
                    {[
                      [productCount, "mahsulot"],
                      [modelCount, "3D model"],
                      [categoryCount, "kategoriya"],
                    ].map(([n, l], k) => (
                      <div key={l} className={k > 0 ? "border-l border-ink/15 pl-5" : ""}>
                        <dd className="font-display text-3xl leading-none text-ink md:text-4xl"><Counter to={n} /></dd>
                        <dt className="mt-2 text-xs text-neutral-500">{l}</dt>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
                  <HeroModel product={hero} />
                </div>
              </div>
            </div>
          </section>
      )}

      {/* CATEGORIES */}
      <section className={section}>
        <Reveal className="text-center">
          <p className="eyebrow">Kategoriyalar</p>
          <h2 className="mt-2 text-3xl leading-none md:text-5xl">Xona uchun mebel toping</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-neutral-500">Uy va ofis uchun keng assortiment ichidan tanlang.</p>
          <Link href="/catalog" className="btn-primary mt-6 inline-flex px-6 py-3 text-sm">Barcha kategoriyalar</Link>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.filter((c) => c.slug !== "sumka").map((c, i) => (
            <Reveal key={c.id} delay={i * 60}>
              <Link href={`/catalog/${c.slug}`} className="group block h-full rounded-2xl border border-line bg-slate-50 p-5 transition-colors hover:border-ink/25 hover:bg-white">
                <div className="relative mb-4 grid aspect-4/3 place-items-center overflow-hidden rounded-xl bg-white">
                  {c.products[0]?.imageUrl ? (
                    <img src={c.products[0].imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full scale-105 object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-110" />
                  ) : (
                    <CategoryIcon slug={c.slug} size={36} className="text-neutral-400" />
                  )}
                </div>
                <h3 className="cap text-base font-bold text-ink">{c.name}</h3>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">{CATEGORY_BLURB[c.slug] || "Sifatli va zamonaviy mebellar to'plami."}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                  Ko&apos;rish
                  <svg className="transition-transform group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className={section}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-line py-8 lg:grid-cols-4 lg:gap-0">
          {site.benefits.map((b, k) => (
            <div key={k} className={`flex items-start gap-3.5 ${k > 0 ? "lg:border-l lg:border-line lg:pl-8" : ""} ${k === 0 ? "lg:pr-8" : k < 3 ? "lg:pr-8" : ""}`}>
              <svg className="mt-0.5 shrink-0 text-brand" width="26" height="26" viewBox="0 0 24 24" fill="none"><path d={BENEFIT_ICONS[k]} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight text-ink">{b.title}</p>
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-neutral-500">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className={section}>
        <Reveal>
          <HomeTabs
            tabs={[
              { key: "popular", label: "Ommabop", href: "/catalog", products: popular },
              { key: "new", label: "Yangi", href: "/catalog", products: latest },
              { key: "sale", label: "Chegirmalar", href: "/catalog?sale=1", products: sale },
            ]}
          />
        </Reveal>
      </section>

      {/* 3D SHOWCASE */}
      {showcase.length > 0 && (
        <section className={section}>
          <Reveal>
            <ColorShowcase items={showcase} />
          </Reveal>
        </section>
      )}

      {/* WORKSHOP VIDEOS */}
      {videosRaw.length > 0 && (
        <section className={section}>
          <Reveal>
            <WorkshopVideos items={videosRaw} />
          </Reveal>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className={section}>
        <Reveal>
          <p className="eyebrow">Jarayon</p>
          <h2 className="mt-2 text-3xl leading-none md:text-5xl">AR qanday ishlaydi</h2>
        </Reveal>
        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 100}>
              <div className="border-t border-ink pt-5">
                <span className="font-display text-4xl leading-none text-brand">0{i + 1}</span>
                <h3 className="mt-5 text-lg font-medium leading-snug">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FIT */}
      <section id="sigadimi" className={`${section} scroll-mt-24`}>
        <Reveal>
          <form action="/catalog" method="get" className="grid gap-8 rounded-lg border border-line bg-white p-6 md:grid-cols-2 md:items-center md:gap-14 md:p-12">
            <div>
              <p className="eyebrow">O&apos;lchamlar</p>
              <h2 className="mt-2 text-3xl leading-[1.08] md:text-4xl">Xonamga sig&apos;adimi?</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-600 md:text-base">Mebel qo&apos;yadigan joyingiz o&apos;lchamini kiriting, sig&apos;adigan mebellarni ko&apos;rsatamiz.</p>
            </div>
            <div>
              <div className="grid grid-cols-3 gap-3">
                {[["fw", "Eni, sm", "200"], ["fd", "Chuqurligi, sm", "90"], ["fh", "Balandligi, sm", "220"]].map(([k, l, ph]) => (
                  <label key={k} className="text-xs text-neutral-500">
                    {l}
                    <input name={k} type="number" min="0" placeholder={ph} className="mt-1.5 w-full rounded-md border border-line bg-background px-3 py-3 text-base text-ink outline-none transition placeholder:text-neutral-300 focus:border-ink" />
                  </label>
                ))}
              </div>
              <button type="submit" className="btn-primary mt-4 w-full py-3.5 text-sm">Sig&apos;adiganlarni ko&apos;rsat</button>
            </div>
          </form>
        </Reveal>
      </section>

      <RecentlyViewed />

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-4 pt-16 md:pt-24">
        <Reveal className="text-center">
          <p className="eyebrow">Savollar</p>
          <h2 className="mt-2 text-3xl leading-none md:text-5xl">Ko&apos;p so&apos;raladigan savollar</h2>
        </Reveal>
        <div className="mt-10 border-t border-line">
          {pages.faq.slice(0, 4).map((f, i) => (
            <Reveal key={f.q} delay={i * 70}>
              <details className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[15px] font-medium text-ink md:text-base">
                  {f.q}
                  <svg className="shrink-0 text-neutral-400 transition-transform duration-300 group-open:rotate-45 group-open:text-ink" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </summary>
                <p className="max-w-2xl pb-6 text-sm leading-relaxed text-neutral-600 whitespace-pre-line">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
        {pages.faq.length > 4 && (
          <p className="mt-6 text-center"><Link href="/faq" className="border-b border-ink pb-0.5 text-sm font-medium text-ink">Barcha savollar</Link></p>
        )}
      </section>

      {/* CONTACT CTA */}
      <section className={section}>
        <Reveal>
          <div className="grid gap-10 rounded-lg bg-ink p-8 text-white md:grid-cols-[1.2fr_1fr] md:items-end md:p-14">
            <div className="max-w-xl">
              <p className="eyebrow text-brand-light!">Aloqa</p>
              <h2 className="mt-3 text-3xl leading-[1.08] md:text-5xl">Savolingiz bormi?</h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-400 md:text-base">Mebel tanlashda operatorimiz yordam beradi.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={site.phoneHref} className="rounded-md bg-white px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-slate-100">{site.phone}</a>
                <a href={site.telegram} target="_blank" rel="noopener noreferrer" className="btn-ghost px-7 py-3.5 text-sm">Telegramda yozish</a>
              </div>
            </div>
            <dl className="space-y-5 border-t border-white/15 pt-6 text-sm md:border-l md:border-t-0 md:pl-10 md:pt-0">
              {site.address && (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Manzil</dt>
                  <dd className="mt-1.5 text-neutral-200">{site.address}</dd>
                </div>
              )}
              {site.hours && (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Ish vaqti</dt>
                  <dd className="mt-1.5 text-neutral-200">{site.hours}</dd>
                </div>
              )}
            </dl>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
