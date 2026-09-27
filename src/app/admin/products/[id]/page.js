import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();
  const { createdAt, ...plain } = product;
  return (
    <>
      <h1 className="text-2xl font-extrabold mb-6">Mahsulotni tahrirlash</h1>
      <ProductForm categories={categories} product={plain} />
    </>
  );
}
