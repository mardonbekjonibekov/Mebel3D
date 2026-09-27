import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { saveSetting } from "@/lib/settings";

export async function PUT(request) {
  if (!isAdmin(request)) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const text = (v) => (typeof v === "string" ? v.trim().slice(0, 8000) : "");
  const faq = (Array.isArray(body.faq) ? body.faq : [])
    .slice(0, 30)
    .map((f) => ({ q: text(f?.q).slice(0, 200), a: text(f?.a).slice(0, 2000) }))
    .filter((f) => f.q && f.a);
  await saveSetting("pages", { about: text(body.about), delivery: text(body.delivery), warranty: text(body.warranty), faq });
  return NextResponse.json({ ok: true });
}
