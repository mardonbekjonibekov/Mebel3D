import { prisma } from "@/lib/prisma";

export class OrderError extends Error {}

export async function createOrder({ name, phone, address, note, items, chatId = null, source = "site" }) {
  name = String(name || "").trim().slice(0, 80);
  phone = String(phone || "").trim().slice(0, 30);
  address = String(address || "").trim().slice(0, 300);
  note = String(note || "").trim().slice(0, 500) || null;

  if (name.length < 2) throw new OrderError("Ismingizni kiriting");
  if (phone.replace(/\D/g, "").length < 9) throw new OrderError("Telefon raqamni to'g'ri kiriting");
  if (address.length < 3) throw new OrderError("Manzilni kiriting");

  const wanted = new Map();
  for (const it of (Array.isArray(items) ? items : []).slice(0, 50)) {
    const qty = Math.min(99, Math.max(1, parseInt(it.qty, 10) || 0));
    if (!it.id || !qty) continue;
    const key = `${it.id}|${it.color || ""}`;
    const prev = wanted.get(key);
    wanted.set(key, { id: String(it.id), color: it.color ? String(it.color) : null, qty: (prev?.qty || 0) + qty });
  }
  if (wanted.size === 0) throw new OrderError("Savatcha bo'sh");

  const products = await prisma.product.findMany({ where: { id: { in: [...new Set([...wanted.values()].map((w) => w.id))] } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = [];
  for (const w of wanted.values()) {
    const p = byId.get(w.id);
    if (!p) continue;
    let color = null;
    let colorHex = null;
    try {
      const found = JSON.parse(p.colors || "[]").find((c) => c.name === w.color);
      color = found?.name || null;
      colorHex = found?.hex || null;
    } catch {}
    lines.push({ id: p.id, name: p.name, price: p.price, qty: w.qty, color, colorHex, image: p.imageUrl });
  }
  if (lines.length === 0) throw new OrderError("Mahsulotlar topilmadi");

  const total = lines.reduce((s, i) => s + i.price * i.qty, 0);
  return prisma.order.create({
    data: { name, phone, address, note, total, items: JSON.stringify(lines), chatId: chatId ? String(chatId) : null, source },
  });
}
