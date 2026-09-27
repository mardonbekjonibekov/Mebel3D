import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { DEFAULT_SITE, saveSetting } from "@/lib/settings";

export async function PUT(request) {
  if (!isAdmin(request)) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const clean = {};
  for (const key of Object.keys(DEFAULT_SITE)) {
    let v = typeof body[key] === "string" ? body[key].trim().slice(0, 300) : "";
    if (key === "mapUrl") {
      const m = v.match(/src=["']([^"']+)["']/);
      if (m) v = m[1];
      if (v && !/^https:\/\//.test(v)) v = "";
    }
    if (["telegram", "instagram", "facebook", "youtube"].includes(key) && v && !/^https?:\/\//.test(v)) v = "";
    if (v) clean[key] = v;
  }
  await saveSetting("site", clean);
  return NextResponse.json({ ok: true });
}
