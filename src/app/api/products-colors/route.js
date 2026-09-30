import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/recolor";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { colors: { not: null }, stock: { not: "out" } },
    select: { id: true, name: true, price: true, imageUrl: true, colors: true, category: { select: { name: true, slug: true } } },
    take: 300,
  });

  const out = products
    .map((p) => ({ ...p, colors: parseJson(p.colors, []) }))
    .filter((p) => p.colors.length > 0);

  return NextResponse.json(out);
}
