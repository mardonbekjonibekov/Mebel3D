import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { uniqueSlug } from "@/lib/slug";

export async function PATCH(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  const { id } = await params;
  const { name } = await request.json().catch(() => ({}));
  const clean = String(name || "").trim().slice(0, 40);
  if (clean.length < 2) return NextResponse.json({ error: "Nom kamida 2 harf bo'lsin" }, { status: 400 });
  const same = await prisma.category.findUnique({ where: { name: clean } });
  if (same && same.id !== id) return NextResponse.json({ error: "Bunday kategoriya allaqachon bor" }, { status: 400 });
  try {
    const category = await prisma.category.update({ where: { id }, data: { name: clean, slug: await uniqueSlug(prisma, clean, id) } });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Kategoriya topilmadi" }, { status: 404 });
  }
}

export async function DELETE(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  const { id } = await params;
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json({ error: `Bu kategoriyada ${count} ta mahsulot bor. Avval ularni boshqa kategoriyaga o'tkazing.` }, { status: 409 });
  }
  await prisma.category.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
