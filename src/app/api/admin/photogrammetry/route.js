import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { createJob, JobError } from "@/lib/photogrammetry";

export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === "string" ? body.productId : undefined;
    return NextResponse.json(await createJob({ productId }), { status: 201 });
  } catch (err) {
    if (err instanceof JobError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[photogrammetry]", err);
    return NextResponse.json({ error: "Vazifani yaratib bo'lmadi" }, { status: 500 });
  }
}
