import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { parseBanner } from "@/lib/banners";

export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const data = await parseBanner(await request.formData());
    const last = await prisma.banner.findFirst({ orderBy: { position: "desc" } });
    const banner = await prisma.banner.create({ data: { ...data, position: (last?.position ?? -1) + 1 } });
    return NextResponse.json(banner, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Xatolik" }, { status: 400 });
  }
}
