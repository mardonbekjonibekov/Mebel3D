import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { uniqueSlug } from "@/lib/slug";

export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();
  const { name } = await request.json().catch(() => ({}));
  const clean = String(name || "").trim().slice(0, 40);
  if (clean.length < 2) return NextResponse.json({ error: "Kategoriya nomini kiriting (kamida 2 harf)" }, { status: 400 });
  const exists = await prisma.category.findUnique({ where: { name: clean } });
  if (exists) return NextResponse.json({ error: "Bunday kategoriya allaqachon bor" }, { status: 400 });
  const category = await prisma.category.create({ data: { name: clean, slug: await uniqueSlug(prisma, clean) } });
  return NextResponse.json(category, { status: 201 });
}
