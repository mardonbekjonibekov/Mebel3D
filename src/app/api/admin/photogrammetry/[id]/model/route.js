import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { JobError, readResult } from "@/lib/photogrammetry";

export async function GET(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  try {
    const glb = await readResult((await params).id);
    return new Response(glb, { headers: { "Content-Type": "model/gltf-binary", "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof JobError ? err.message : "Model fayli topilmadi";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
