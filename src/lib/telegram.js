import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { getSite } from "@/lib/settings";

const API = () => process.env.TELEGRAM_API_BASE || "https://api.telegram.org";

export const STATUS_LABEL = { new: "Yangi", confirmed: "Tasdiqlangan", delivered: "Yetkazilgan", cancelled: "Bekor qilingan" };

export const botEnabled = () => Boolean(process.env.TELEGRAM_BOT_TOKEN);
export const siteUrl = () => (process.env.SITE_URL || "").replace(/\/+$/, "");
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const orderNumber = (o) => o.id.slice(-6).toUpperCase();

export async function tg(method, payload = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${API()}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => null);
    if (!data?.ok) console.error("[telegram]", method, data?.description || res.status);
    return data;
  } catch (err) {
    console.error("[telegram]", method, err.message);
    return null;
  }
}

async function readOwners() {
  const row = await prisma.setting.findUnique({ where: { key: "tg_owners" } });
  let list = [];
  try {
    list = JSON.parse(row?.value || "[]");
  } catch {}
  const fromEnv = (process.env.TELEGRAM_OWNER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return [...new Set([...list.map(String), ...fromEnv])];
}

export const getOwners = readOwners;
export async function isOwner(chatId) {
  return (await readOwners()).includes(String(chatId));
}
export async function addOwner(chatId) {
  const row = await prisma.setting.findUnique({ where: { key: "tg_owners" } });
  let list = [];
  try {
    list = JSON.parse(row?.value || "[]");
  } catch {}
  if (!list.map(String).includes(String(chatId))) list.push(String(chatId));
  await prisma.setting.upsert({ where: { key: "tg_owners" }, update: { value: JSON.stringify(list) }, create: { key: "tg_owners", value: JSON.stringify(list) } });
}
export async function removeOwner(chatId) {
  const row = await prisma.setting.findUnique({ where: { key: "tg_owners" } });
  let list = [];
  try {
    list = JSON.parse(row?.value || "[]");
  } catch {}
  await prisma.setting.upsert({
    where: { key: "tg_owners" },
    update: { value: JSON.stringify(list.filter((x) => String(x) !== String(chatId))) },
    create: { key: "tg_owners", value: "[]" },
  });
}

export function orderText(order) {
  let items = [];
  try {
    items = JSON.parse(order.items);
  } catch {}
  const lines = items.map((i) => `• ${esc(i.name)}${i.color ? ` (${esc(i.color)})` : ""} x${i.qty}: ${formatPrice(i.price * i.qty)}`);
  return [
    `<b>Buyurtma #${orderNumber(order)}</b>`,
    `Holat: <b>${STATUS_LABEL[order.status] || order.status}</b>`,
    "",
    `Mijoz: ${esc(order.name)}`,
    `Telefon: ${esc(order.phone)}`,
    `Manzil: ${esc(order.address)}`,
    ...(order.note ? [`Izoh: ${esc(order.note)}`] : []),
    "",
    ...lines,
    "",
    `<b>Jami: ${formatPrice(order.total)}</b>`,
    `Manba: ${order.source === "telegram" ? "Telegram bot" : "Sayt"}`,
  ].join("\n");
}

export function orderKeyboard(order) {
  const id = order.id;
  const rows = [];
  const acts = [];
  if (order.status !== "confirmed" && order.status !== "delivered") acts.push({ text: "Qabul qilish", callback_data: `os:${id}:confirmed` });
  if (order.status !== "delivered") acts.push({ text: "Yetkazildi", callback_data: `os:${id}:delivered` });
  if (acts.length) rows.push(acts);
  if (order.status !== "cancelled") rows.push([{ text: "Bekor qilish", callback_data: `os:${id}:cancelled` }]);
  if (siteUrl()) rows.push([{ text: "Saytda ochish", url: `${siteUrl()}/admin/orders/${id}` }]);
  return { inline_keyboard: rows };
}

export async function notifyOwnersNewOrder(order) {
  if (!botEnabled()) return;
  const owners = await readOwners();
  for (const chat_id of owners) {
    await tg("sendMessage", { chat_id, text: `<b>Yangi buyurtma!</b>\n\n${orderText(order)}`, parse_mode: "HTML", reply_markup: orderKeyboard(order) });
  }
}

const CUSTOMER_MSG = {
  confirmed: (n) => `Buyurtmangiz #${n} qabul qilindi va tasdiqlandi. Tez orada yetkazib beramiz.`,
  delivered: (n) => `Buyurtmangiz #${n} yetkazildi. Xaridingiz uchun rahmat!`,
  cancelled: (n, phone) => `Buyurtmangiz #${n} bekor qilindi. Savollar uchun: ${phone}`,
};

export async function notifyCustomerStatus(order) {
  if (!botEnabled() || !order.chatId || !CUSTOMER_MSG[order.status]) return;
  const SITE = await getSite();
  await tg("sendMessage", { chat_id: order.chatId, text: CUSTOMER_MSG[order.status](orderNumber(order), SITE.phone) });
}
