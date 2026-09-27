import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { friendlyError } from "@/lib/apiError";
import { parseProductForm } from "@/lib/productForm";

export async function GET(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    const data = await parseProductForm(await request.formData(), existing);
    const product = await prisma.product.update({ where: { id }, data });
    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ error: friendlyError(err) }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: friendlyError(err) }, { status: 400 });
  }
}
