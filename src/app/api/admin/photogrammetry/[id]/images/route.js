import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { addImage, JobError } from "@/lib/photogrammetry";

export async function POST(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const file = (await request.formData()).get("file");
    if (!file || typeof file === "string") return NextResponse.json({ error: "Rasm tanlanmagan" }, { status: 400 });
    return NextResponse.json(await addImage((await params).id, file));
  } catch (err) {
    if (err instanceof JobError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[photogrammetry]", err);
    return NextResponse.json({ error: "Rasmni saqlab bo'lmadi" }, { status: 500 });
  }
}
