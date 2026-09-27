import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductDetail from "@/components/ProductDetail";
import { getSite, getPages } from "@/lib/settings";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import TrackView from "@/components/TrackView";
import RecentlyViewed from "@/components/RecentlyViewed";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id } });
  return { title: p ? p.name : "Mahsulot" };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const [SITE, pagesText] = await Promise.all([getSite(), getPages()]);
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product) notFound();

  const similar = await prisma.product.findMany({
    where: { categoryId: product.categoryId, NOT: { id: product.id } },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  const data = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    oldPrice: product.oldPrice,
    width: product.width,
    depth: product.depth,
    height: product.height,
    material: product.material,
    color: product.color,
    colorParts: (() => { try { const v = JSON.parse(product.colorParts || "null"); return Array.isArray(v) ? v : null; } catch { return null; } })(),
    colors: (() => { try { return JSON.parse(product.colors || "[]"); } catch { return []; } })(),
    warrantyMonths: product.warrantyMonths,
    installmentMonths: product.installmentMonths,
    stock: product.stock,
    leadDays: product.leadDays,
    deliveryText: pagesText.delivery,
    warrantyText: pagesText.warranty,
    imageUrl: product.imageUrl,
    images: (() => { try { const v = JSON.parse(product.images || "null"); return Array.isArray(v) ? v : []; } catch { return []; } })(),
    glbUrl: product.glbUrl,
    usdzUrl: product.usdzUrl,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
  };

  return (
    <div className="pb-28 md:pb-6">
      <TrackView id={product.id} />
      <ProductDetail
        product={data}
        contact={{
          phone: SITE.phone,
          phoneHref: SITE.phoneHref,
          bot: (process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, ""),
          telegram: SITE.telegram,
        }}
      />
      {similar.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <Reveal>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">O&apos;xshash mahsulotlar</h2>
          </Reveal>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {similar.map((p, i) => (
              <Reveal key={p.id} delay={i * 70} className="h-full">
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}
