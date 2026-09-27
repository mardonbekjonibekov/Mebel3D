import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

export function proxy(request) {
  return isAdmin(request) ? NextResponse.next() : unauthorized();
}

export const config = {
  matcher: ["/admin/:path*"],
};
