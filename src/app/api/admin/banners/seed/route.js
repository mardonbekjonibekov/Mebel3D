import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { DEFAULT_BANNERS } from "@/lib/defaultBanners";

export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();
  if ((await prisma.banner.count()) > 0) return NextResponse.json({ error: "Bannerlar allaqachon bor" }, { status: 400 });
  await prisma.$transaction(
    DEFAULT_BANNERS.map((b, i) =>
      prisma.banner.create({ data: { title: b.title, subtitle: b.subtitle, buttonText: b.buttonText, link: b.link, tone: b.tone, active: true, position: i } })
    )
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}
