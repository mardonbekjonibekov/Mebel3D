import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { notifyCustomerStatus } from "@/lib/telegram";

const STATUSES = ["new", "confirmed", "delivered", "cancelled"];

export async function PATCH(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  const { id } = await params;
  const { status } = await request.json();
  if (!STATUSES.includes(status)) return NextResponse.json({ error: "Noto'g'ri holat" }, { status: 400 });
  const order = await prisma.order.update({ where: { id }, data: { status } });
  notifyCustomerStatus(order).catch(() => {});
  return NextResponse.json(order);
}

export async function DELETE(request, { params }) {
  if (!isAdmin(request)) return unauthorized();
  const { id } = await params;
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
