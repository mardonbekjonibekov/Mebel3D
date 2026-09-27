import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { friendlyError } from "@/lib/apiError";
import { parseProductForm } from "@/lib/productForm";

export async function GET(request) {
  if (!isAdmin(request)) return unauthorized();
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" }, include: { category: true } });
  return NextResponse.json(products);
}

export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const data = await parseProductForm(await request.formData());
    const product = await prisma.product.create({ data });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: friendlyError(err) }, { status: 400 });
  }
}
