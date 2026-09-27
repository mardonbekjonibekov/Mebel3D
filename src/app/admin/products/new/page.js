import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <h1 className="text-2xl font-extrabold mb-6">Yangi mahsulot</h1>
      <ProductForm categories={categories} />
    </>
  );
}
