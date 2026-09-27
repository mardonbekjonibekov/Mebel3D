import { NextResponse } from "next/server";
import { handleUpdate } from "@/lib/telegramBot";

export async function POST(request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!process.env.TELEGRAM_BOT_TOKEN || !secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    await handleUpdate(await request.json());
  } catch (err) {
    console.error("[telegram webhook]", err);
  }
  return NextResponse.json({ ok: true });
}
