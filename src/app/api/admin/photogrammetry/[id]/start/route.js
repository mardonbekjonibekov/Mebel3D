import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { JobError, startJob } from "@/lib/photogrammetry";

export async function POST(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(await startJob((await params).id, body));
  } catch (err) {
    if (err instanceof JobError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[photogrammetry]", err);
    return NextResponse.json({ error: "Jarayonni boshlab bo'lmadi" }, { status: 500 });
  }
}
