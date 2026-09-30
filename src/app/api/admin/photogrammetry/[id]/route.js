import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { cancelJob, getJob } from "@/lib/photogrammetry";

export async function GET(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  const job = getJob((await params).id);
  if (!job) return NextResponse.json({ error: "Vazifa topilmadi" }, { status: 404 });
  return NextResponse.json(job);
}

export async function DELETE(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  await cancelJob((await params).id);
  return NextResponse.json({ ok: true });
}
