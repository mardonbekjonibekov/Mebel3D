// Usage:
//   node scripts/telegram.mjs poll [http://localhost:3000]   -> local mode: no public URL needed
//   node scripts/telegram.mjs webhook https://your-domain    -> production: Telegram calls your site
//   node scripts/telegram.mjs info                           -> show bot username
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

const call = async (method, body = {}) => (await fetch(`${api}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();

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
      offset = u.update_id + 1;
      try {
        const res = await fetch(target, { method: "POST", headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": secret }, body: JSON.stringify(u) });
        if (!res.ok) console.error("Sayt javobi:", res.status, "(sayt ishlab turibdimi? .env dagi TELEGRAM_WEBHOOK_SECRET bir xilmi?)");
      } catch (e) {
        console.error("Saytga ulanib bo'lmadi:", e.message);
      }
    }
  }
} else if (cmd !== "info") {
  console.log("Buyruqlar: poll | webhook <https-url> | info");
}
