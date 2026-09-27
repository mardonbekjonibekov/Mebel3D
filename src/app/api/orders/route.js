import { NextResponse } from "next/server";
import { createOrder, OrderError } from "@/lib/orders";
import { notifyOwnersNewOrder } from "@/lib/telegram";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  try {
    const order = await createOrder({ ...body, source: "site" });
    notifyOwnersNewOrder(order).catch((e) => console.error("[telegram] notify failed", e));
    return NextResponse.json({ id: order.id }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[orders]", err);
    return NextResponse.json({ error: "Buyurtmani saqlab bo'lmadi, qayta urinib ko'ring" }, { status: 500 });
  }
}
