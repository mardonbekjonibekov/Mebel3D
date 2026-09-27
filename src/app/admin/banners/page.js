import { prisma } from "@/lib/prisma";
import BannerManager from "@/components/admin/BannerManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bannerlar" };

export default async function BannersPage() {
  const banners = await prisma.banner.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  return <BannerManager banners={banners.map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle, buttonText: b.buttonText, link: b.link, imageUrl: b.imageUrl, tone: b.tone, active: b.active }))} />;
}
