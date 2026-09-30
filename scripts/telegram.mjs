// Usage:
//   node scripts/telegram.mjs poll [http://localhost:3000]   -> local mode: no public URL needed
//   node scripts/telegram.mjs webhook https://your-domain    -> production: Telegram calls your site
//   node scripts/telegram.mjs info                           -> show bot username
//   node scripts/telegram.mjs commands                       -> register the "/" menu button (run once, or after changing COMMANDS below)

const COMMANDS = [
  { command: "start", description: "Botni qayta ishga tushirish" },
  { command: "catalog", description: "Katalogni ko'rish" },
  { command: "cancel", description: "Joriy amalni bekor qilish" },
];
import fs from "fs";
import path from "path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const env = { ...process.env };
try {
  for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && env[m[1]] === undefined) env[m[1]] = m[2];
  }
} catch {}

const token = env.TELEGRAM_BOT_TOKEN;
const secret = env.TELEGRAM_WEBHOOK_SECRET;
const api = (env.TELEGRAM_API_BASE || "https://api.telegram.org") + "/bot" + token;
const [cmd, arg] = process.argv.slice(2);

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN .env faylida yo'q. @BotFather dan token oling va .env ga yozing.");
  process.exit(1);
}

// Telegram API is sometimes unreachable for a few seconds on some networks: retry instead of crashing.
const call = async (method, body = {}) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${api}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(40000) });
      return await res.json();
    } catch (e) {
      if (method === "getMe" && attempt >= 5) throw e;
      console.error(`[${method}] tarmoq xatosi (${e.cause?.code || e.message}), qayta urinaman...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
};

const me = await call("getMe");
if (!me.ok) {
  console.error("Token noto'g'ri:", me.description);
  process.exit(1);
}
console.log(`Bot: @${me.result.username}`);
if (env.TELEGRAM_BOT_USERNAME && env.TELEGRAM_BOT_USERNAME.replace(/^@/, "") !== me.result.username) {
  console.warn(`Diqqat: .env dagi TELEGRAM_BOT_USERNAME (${env.TELEGRAM_BOT_USERNAME}) bot nomiga (${me.result.username}) mos emas.`);
}

if (cmd === "webhook") {
  if (!arg || !arg.startsWith("https://")) {
    console.error("HTTPS manzil kerak: node scripts/telegram.mjs webhook https://sizning-domen.uz");
    process.exit(1);
  }
  const r = await call("setWebhook", { url: arg.replace(/\/+$/, "") + "/api/telegram/webhook", secret_token: secret, allowed_updates: ["message", "callback_query"] });
  console.log(r.ok ? "Webhook o'rnatildi." : "Xato: " + r.description);
} else if (cmd === "poll") {
  const target = (arg || "http://localhost:3000").replace(/\/+$/, "") + "/api/telegram/webhook";
  await call("deleteWebhook");
  console.log("Polling boshlandi. Sayt manzili:", target, "(to'xtatish: Ctrl+C)");
  let offset = 0;
  for (;;) {
    const r = await call("getUpdates", { offset, timeout: 25, allowed_updates: ["message", "callback_query"] });
    if (!r.ok) {
      console.error("getUpdates xato:", r.description);
      await new Promise((s) => setTimeout(s, 3000));
      continue;
    }
    for (const u of r.result) {
      // Only mark this update as consumed (advance offset) once the site has actually
      // accepted it. Otherwise a transient hiccup (site mid-restart, network blip) would
      // silently drop the message forever, since Telegram won't redeliver an update once
      // getUpdates has been called with an offset past it.
      let delivered = false;
      for (let attempt = 1; attempt <= 5 && !delivered; attempt++) {
        try {
          const res = await fetch(target, { method: "POST", headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": secret }, body: JSON.stringify(u), signal: AbortSignal.timeout(15000) });
          if (res.ok) {
            delivered = true;
          } else {
            console.error("Sayt javobi:", res.status, "(sayt ishlab turibdimi? .env dagi TELEGRAM_WEBHOOK_SECRET bir xilmi?)");
          }
        } catch (e) {
          console.error(`Saytga ulanib bo'lmadi (${attempt}/5):`, e.message);
        }
        if (!delivered) await new Promise((s) => setTimeout(s, 2000));
      }
      if (!delivered) console.error("Diqqat: bu xabar saytga yetkazilmadi, o'tkazib yuboriladi:", JSON.stringify(u).slice(0, 200));
      offset = u.update_id + 1;
    }
  }
} else if (cmd === "commands") {
  const r1 = await call("setMyCommands", { commands: COMMANDS });
  const r2 = await call("setChatMenuButton", { menu_button: { type: "commands" } });
  console.log(r1.ok && r2.ok ? "Menu tugmasi o'rnatildi. Telegram ilovasini qayta oching (chatni yopib-oching) — matn maydoni yonida \"Menu\" tugmasi chiqadi." : "Xato: " + (r1.description || r2.description));
} else if (cmd !== "info") {
  console.log("Buyruqlar: poll | webhook <https-url> | info | commands");
}
