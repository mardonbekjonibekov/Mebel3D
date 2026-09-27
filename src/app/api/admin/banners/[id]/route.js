import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { parseBanner } from "@/lib/banners";

export async function PUT(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  const { id } = await params;
  try {
    const data = await parseBanner(await request.formData());
    return NextResponse.json(await prisma.banner.update({ where: { id }, data }));
  } catch (err) {
    return NextResponse.json({ error: err.message || "Xatolik" }, { status: 400 });
  }
}

export async function PATCH(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const all = await prisma.banner.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  const i = all.findIndex((b) => b.id === id);
  if (i < 0) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  if (typeof body.active === "boolean") await prisma.banner.update({ where: { id }, data: { active: body.active } });
  if (body.move === "up" || body.move === "down") {
    const j = body.move === "up" ? i - 1 : i + 1;
    if (j >= 0 && j < all.length) {
      const order = all.map((b) => b.id);
      [order[i], order[j]] = [order[j], order[i]];
      await Promise.all(order.map((bid, pos) => prisma.banner.update({ where: { id: bid }, data: { position: pos } })));
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  const { id } = await params;
  await prisma.banner.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
