import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { getSite } from "@/lib/settings";
import { createOrder, OrderError } from "@/lib/orders";
import {
  tg, esc, siteUrl, isOwner, addOwner, removeOwner, orderText, orderKeyboard, orderNumber,
  notifyOwnersNewOrder, notifyCustomerStatus, STATUS_LABEL,
} from "@/lib/telegram";

const send = (chat_id, text, extra = {}) => tg("sendMessage", { chat_id, text, parse_mode: "HTML", ...extra });

// Persistent bottom keyboard (stays visible under the message box regardless of any
// per-message inline keyboards) so the chat is always one tap away from the catalog,
// without typing /start again.
const MAIN_KEYBOARD = {
  keyboard: [[{ text: "🛋 Katalog" }, { text: "🏠 Bosh menyu" }]],
  resize_keyboard: true,
  is_persistent: true,
};

async function getSession(chatId) {
  const s = await prisma.tgSession.findUnique({ where: { chatId } });
  if (!s) return null;
  try {
    return { step: s.step, data: JSON.parse(s.data || "{}") };
  } catch {
    return { step: s.step, data: {} };
  }
}
const setSession = (chatId, step, data) =>
  prisma.tgSession.upsert({ where: { chatId }, update: { step, data: JSON.stringify(data) }, create: { chatId, step, data: JSON.stringify(data) } });
const clearSession = (chatId) => prisma.tgSession.deleteMany({ where: { chatId } });

const parseColors = (p) => {
  try {
    return JSON.parse(p.colors || "[]");
  } catch {
    return [];
  }
};

async function sendWelcome(chatId) {
  const SITE = await getSite();
  const url = siteUrl();
  const lines = [
    `Assalomu alaykum! <b>${esc(SITE.name)}</b> do'koniga xush kelibsiz.`,
    "",
    `Pastdagi <b>🛋 Katalog</b> tugmasi orqali mahsulotlarni ko'ring.`,
  ];
  if (url) lines.push("", `Sayt: ${url}/catalog`);
  lines.push("", `Telefon: ${esc(SITE.phone)}`);
  await send(chatId, lines.join("\n"), { reply_markup: MAIN_KEYBOARD });
}

const CATALOG_PAGE_SIZE = 6;

async function sendCategories(chatId) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  if (categories.length === 0) return send(chatId, "Hozircha kategoriyalar yo'q.");
  await send(chatId, "Kategoriyani tanlang:", {
    reply_markup: { inline_keyboard: categories.map((c) => [{ text: `${c.name} (${c._count.products})`, callback_data: `cs:${c.slug}:0` }]) },
  });
}

async function sendCategoryProducts(chatId, slug, page) {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return send(chatId, "Bu kategoriya topilmadi.");
  const total = await prisma.product.count({ where: { categoryId: category.id } });
  if (total === 0) return send(chatId, "Bu kategoriyada hali mahsulot yo'q.");
  const products = await prisma.product.findMany({
    where: { categoryId: category.id },
    orderBy: { createdAt: "desc" },
    skip: page * CATALOG_PAGE_SIZE,
    take: CATALOG_PAGE_SIZE,
  });
  const rows = products.map((p) => {
    const name = p.name.length > 38 ? `${p.name.slice(0, 37)}…` : p.name;
    return [{ text: `${name} — ${formatPrice(p.price)}`, callback_data: `pv:${p.id}:${slug}:${page}` }];
  });
  const nav = [];
  if (page > 0) nav.push({ text: "⬅️ Oldingi", callback_data: `cs:${slug}:${page - 1}` });
  if ((page + 1) * CATALOG_PAGE_SIZE < total) nav.push({ text: "Keyingi ➡️", callback_data: `cs:${slug}:${page + 1}` });
  if (nav.length) rows.push(nav);
  rows.push([{ text: "🔙 Kategoriyalar", callback_data: "cat" }]);
  await send(chatId, `<b>${esc(category.name)}</b>`, { reply_markup: { inline_keyboard: rows } });
}

async function sendProduct(chatId, productId, colorIdx, back) {
  const p = await prisma.product.findUnique({ where: { id: productId }, include: { category: true } });
  if (!p) return send(chatId, "Bu mahsulot topilmadi. Katalogdan qayta tanlang.");
  const colors = parseColors(p);
  const color = colors[Number(colorIdx)]?.name;
  const size = [p.width, p.depth, p.height].every(Boolean) ? `\nO'lchami: ${p.width} x ${p.depth} x ${p.height} sm` : "";
  const caption = [`<b>${esc(p.name)}</b>`, p.category ? esc(p.category.name) : "", `Narxi: <b>${formatPrice(p.price)}</b>`, color ? `Rang: ${esc(color)}` : "", size.trim()]
    .filter(Boolean)
    .join("\n");
  const url = siteUrl();
  // colorIdx already carries the right meaning from every caller: "-" (not chosen yet),
  // "x" (explicitly "asl rang") or a numeric index — passing it straight through avoids
  // losing an explicit "asl rang" pick, which `color ? colorIdx : "-"` used to do (Number("x")
  // is NaN, so `color` was falsy even though a color HAD been chosen, causing the button
  // below to reopen "Rangni tanlang" in a loop instead of proceeding to checkout).
  const buttons = [[{ text: "Buyurtma berish", callback_data: `o:${p.id}:${colorIdx}` }]];
  if (url) buttons.push([{ text: "Saytda ko'rish (3D / AR)", url: `${url}/product/${p.id}` }]);
  if (back) buttons.push([{ text: "🔙 Orqaga", callback_data: back }]);
  const markup = { inline_keyboard: buttons };

  if (url && p.imageUrl) {
    const r = await tg("sendPhoto", { chat_id: chatId, photo: `${url}${p.imageUrl}`, caption, parse_mode: "HTML", reply_markup: markup });
    if (r?.ok) return;
  }
  await send(chatId, caption, { reply_markup: markup });
}

async function askPhone(chatId, data) {
  await setSession(chatId, "phone", data);
  await send(chatId, "Telefon raqamingizni yuboring: pastdagi tugmani bosing yoki raqamni yozing.", {
    reply_markup: { keyboard: [[{ text: "Raqamni yuborish", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true },
  });
}

async function startOrder(chatId, productId, colorIdx) {
  const p = await prisma.product.findUnique({ where: { id: productId } });
  if (!p) return send(chatId, "Bu mahsulot topilmadi.");
  const colors = parseColors(p);
  if (colors.length > 0 && colorIdx === "-") {
    return send(chatId, "Rangni tanlang:", {
      reply_markup: {
        inline_keyboard: [
          ...colors.map((c, i) => [{ text: c.name, callback_data: `oc:${p.id}:${i}` }]),
          [{ text: "Asl rang", callback_data: `oc:${p.id}:x` }],
        ],
      },
    });
  }
  const color = colors[Number(colorIdx)]?.name || null;
  await askPhone(chatId, { productId: p.id, color });
}

async function handleText(msg, chatId) {
  const text = (msg.text || "").trim();
  const session = await getSession(chatId);

  if (text === "/cancel") {
    await clearSession(chatId);
    return send(chatId, "Bekor qilindi.", { reply_markup: MAIN_KEYBOARD });
  }

  if (text === "🛋 Katalog") {
    await clearSession(chatId);
    return sendCategories(chatId);
  }
  if (text === "🏠 Bosh menyu") {
    await clearSession(chatId);
    return sendWelcome(chatId);
  }

  if (session?.step === "phone") {
    const phone = msg.contact?.phone_number ? `+${msg.contact.phone_number.replace(/^\+/, "")}` : text;
    if (phone.replace(/\D/g, "").length < 9) return send(chatId, "Telefon raqam noto'g'ri. Qayta yozing (masalan +998901234567).");
    await setSession(chatId, "address", { ...session.data, phone });
    return send(chatId, "Yetkazib berish manzilini yozing:", { reply_markup: { remove_keyboard: true } });
  }

  if (session?.step === "address") {
    if (text.length < 3) return send(chatId, "Manzilni to'liqroq yozing.");
    const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || "Telegram mijoz";
    try {
      const order = await createOrder({
        name, phone: session.data.phone, address: text, chatId, source: "telegram",
        note: msg.from?.username ? `Telegram: @${msg.from.username}` : null,
        items: [{ id: session.data.productId, qty: 1, color: session.data.color }],
      });
      await clearSession(chatId);
      const SITE = await getSite();
      await send(chatId, `Buyurtmangiz qabul qilindi. Raqami: <b>#${orderNumber(order)}</b>\nJami: ${formatPrice(order.total)}\n\nOperator tez orada siz bilan bog'lanadi.\nTelefon: ${esc(SITE.phone)}`, { reply_markup: MAIN_KEYBOARD });
      await notifyOwnersNewOrder(order);
    } catch (err) {
      await clearSession(chatId);
      await send(chatId, err instanceof OrderError ? err.message : "Xatolik yuz berdi. Keyinroq urinib ko'ring.", { reply_markup: MAIN_KEYBOARD });
    }
    return;
  }

  if (text.startsWith("/start")) {
    const payload = text.split(/\s+/)[1] || "";
    const m = payload.match(/^p_([A-Za-z0-9]+)(?:_(\d+))?$/);
    if (m) return sendProduct(chatId, m[1], m[2] ?? "-");
    return sendWelcome(chatId);
  }

  if (text.startsWith("/catalog")) return sendCategories(chatId);

  if (text.startsWith("/link")) {
    const code = text.split(/\s+/)[1] || "";
    const expected = process.env.TELEGRAM_LINK_CODE;
    if (!expected || code !== expected) return send(chatId, "Kod noto'g'ri.");
    await addOwner(chatId);
    return send(chatId, "Ulandi. Endi yangi buyurtmalar shu yerga keladi.\n\n/orders: so'nggi buyurtmalar\n/unlink: xabarlarni to'xtatish");
  }

  if (text.startsWith("/unlink")) {
    await removeOwner(chatId);
    return send(chatId, "Buyurtma xabarlari to'xtatildi.");
  }

  if (text.startsWith("/orders")) {
    if (!(await isOwner(chatId))) return send(chatId, "Bu buyruq faqat do'kon egasi uchun. Ulanish: /link KOD");
    const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 });
    if (orders.length === 0) return send(chatId, "Hali buyurtma yo'q.");
    return send(chatId, "So'nggi buyurtmalar:", {
      reply_markup: {
        inline_keyboard: orders.map((o) => [{ text: `#${orderNumber(o)} ${o.name}: ${formatPrice(o.total)} (${STATUS_LABEL[o.status] || o.status})`, callback_data: `ov:${o.id}` }]),
      },
    });
  }

  return sendWelcome(chatId);
}

async function handleCallback(cb) {
  const chatId = String(cb.message?.chat?.id || cb.from.id);
  const [kind, a, b, c] = (cb.data || "").split(":");
  const answer = (text) => tg("answerCallbackQuery", { callback_query_id: cb.id, ...(text ? { text } : {}) });

  if (kind === "cat") {
    await answer();
    return sendCategories(chatId);
  }
  if (kind === "cs") {
    await answer();
    return sendCategoryProducts(chatId, a, Number(b) || 0);
  }
  if (kind === "pv") {
    await answer();
    return sendProduct(chatId, a, "-", `cs:${b}:${c || 0}`);
  }
  if (kind === "o") {
    await answer();
    // Same hygiene as "oc": once acted on, disable this card's own button so a delayed
    // second tap (or a tap on an old copy of this same card) can't resubmit silently.
    await tg("editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] } });
    return startOrder(chatId, a, b);
  }
  if (kind === "oc") {
    await answer();
    // Strip the "Rangni tanlang" buttons from the OLD message first: otherwise several
    // product cards pile up in the chat and an old, already-acted-on color button stays
    // tappable, silently placing the order with a stale color instead of the one just picked.
    await tg("editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] } });
    // Show the product card (photo, price, the color just picked) before "Buyurtma
    // berish" — same card sendProduct always shows, now carrying the chosen color idx
    // so its own order button goes straight to checkout instead of asking again.
    return sendProduct(chatId, a, b);
  }

  if (kind === "ov" || kind === "os") {
    if (!(await isOwner(chatId))) return answer("Ruxsat yo'q");
    let order = await prisma.order.findUnique({ where: { id: a } });
    if (!order) return answer("Buyurtma topilmadi");

    if (kind === "os" && ["confirmed", "delivered", "cancelled"].includes(b) && order.status !== b) {
      order = await prisma.order.update({ where: { id: a }, data: { status: b } });
      await notifyCustomerStatus(order);
      await answer(`Holat: ${STATUS_LABEL[b]}`);
      return tg("editMessageText", { chat_id: chatId, message_id: cb.message.message_id, text: orderText(order), parse_mode: "HTML", reply_markup: orderKeyboard(order) });
    }
    await answer();
    if (kind === "ov") return send(chatId, orderText(order), { reply_markup: orderKeyboard(order) });
    return;
  }
  return answer();
}

export async function handleUpdate(update) {
  if (update.callback_query) return handleCallback(update.callback_query);
  const msg = update.message;
  if (!msg || msg.chat?.type !== "private") return;
  return handleText(msg, String(msg.chat.id));
}
