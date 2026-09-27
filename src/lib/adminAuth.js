import { NextResponse } from "next/server";

export function checkBasicAuth(header) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass || !header) return false;
  return header === "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

export function isAdmin(request) {
  return checkBasicAuth(request.headers.get("authorization"));
}

export function unauthorized() {
  return new NextResponse("Kirish uchun login/parol kerak", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin panel"' },
  });
}
