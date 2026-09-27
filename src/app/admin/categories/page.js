import { prisma } from "@/lib/prisma";
import CategoryManager from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kategoriyalar" };

export default async function AdminCategories() {
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  return <CategoryManager categories={cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: c._count.products }))} />;
}
