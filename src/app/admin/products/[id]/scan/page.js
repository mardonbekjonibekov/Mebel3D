import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Scanner from "@/components/admin/Scanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "3D skanerlash" };

export default async function ScanPage({ params }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true, height: true, glbUrl: true } });
  if (!product) notFound();
  return <Scanner product={product} />;
}
