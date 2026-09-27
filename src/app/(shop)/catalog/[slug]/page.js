import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CatalogView from "@/components/CatalogView";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();
  return <CatalogView category={category} searchParams={await searchParams} />;
}
