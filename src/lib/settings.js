import { cache } from "react";
import { prisma } from "@/lib/prisma";

const env = process.env;

export const DEFAULT_SITE = {
  name: env.SITE_NAME || "Mebel3D",
  tagline: "3D va AR bilan mebel do'koni",
  phone: env.SITE_PHONE || "+998 90 123 45 67",
  phone2: "",
  email: "",
  address: env.SITE_ADDRESS || "Toshkent shahri",
  hours: "Har kuni 09:00 dan 20:00 gacha",
  mapUrl: "",
  telegram: env.SITE_TELEGRAM || "https://t.me/mebel3d",
  instagram: "",
  facebook: "",
  youtube: "",
  popular: "Divan, Stol, Kreslo, Krevat, Shkaf",
  benefit1Title: "Kafolat",
  benefit1Text: "Mebelga ishlab chiqaruvchi kafolati",
  benefit2Title: "Yetkazib berish",
  benefit2Text: "Shahar va viloyatlarga yetkazamiz",
  benefit3Title: "Bo'lib to'lash",
  benefit3Text: "Qulay oylik to'lov imkoniyati",
  benefit4Title: "3D va AR",
  benefit4Text: "Mebelni uyingizda oldindan ko'ring",
};

export const DEFAULT_PAGES = {
  about:
    "Biz mebelni sotib olishni osonlashtiramiz. Har bir mahsulotni 3D formatda aylantirib ko'rasiz va telefon kamerasi orqali o'z xonangizga qo'yib, o'lchami va rangini oldindan baholaysiz.\n\nBu namuna matn. Do'kon haqidagi haqiqiy ma'lumotni admin paneldagi \"Sahifalar\" bo'limida yozing.",
  delivery:
    "Yetkazib berish narxi va muddati manzil va mebel turiga qarab operator bilan kelishiladi.\n\nTo'lov usullari: naqd pul yetkazib berilganda yoki bo'lib to'lash (mahsulot sahifasida ko'rsatilgan bo'lsa).\n\nBu namuna matn. Haqiqiy shartlarni admin paneldagi \"Sahifalar\" bo'limida yozing.",
  warranty:
    "Mebelga ishlab chiqaruvchi kafolati beriladi. Kafolat muddati mahsulot sahifasida ko'rsatilgan.\n\nKafolat ishlab chiqarish nuqsonlariga tegishli. Noto'g'ri foydalanish natijasidagi shikastlar kafolatga kirmaydi.\n\nBu namuna matn. Haqiqiy shartlarni admin paneldagi \"Sahifalar\" bo'limida yozing.",
  faq: [
    { q: "Qaysi telefonlarda AR ishlaydi?", a: "iPhone va iPad'larda (iOS 12+) Safari orqali, Android'da ARCore qo'llab-quvvatlaydigan telefonlarda Chrome orqali ishlaydi. Alohida ilova o'rnatish shart emas." },
    { q: "Buyurtmani qanday beraman?", a: "Savatchaga qo'shib buyurtma bering yoki mahsulot sahifasidagi «Telegramda buyurtma» tugmasini bosing. Operator siz bilan bog'lanadi." },
    { q: "Mebelning rangini tanlasa bo'ladimi?", a: "Ha, mahsulot sahifasida rang doiralari bo'lsa, ularni bosib mebelni 3D'da boshqa rangda ko'rasiz va buyurtmada o'sha rangni tanlaysiz." },
    { q: "Yetkazib berish qancha vaqt oladi?", a: "Muddat manzil va mebel turiga bog'liq, operator buyurtmani tasdiqlaganda aniq vaqtni aytadi." },
    { q: "Kafolat bormi?", a: "Kafolat muddati har bir mahsulot sahifasida ko'rsatilgan. Batafsil shartlar «Kafolat va qaytarish» sahifasida." },
  ],
};

async function readJson(key) {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row ? JSON.parse(row.value) : {};
  } catch {
    return {};
  }
}

export const getSite = cache(async () => {
  const saved = await readJson("site");
  const site = { ...DEFAULT_SITE };
  for (const k of Object.keys(DEFAULT_SITE)) if (typeof saved[k] === "string" && saved[k].trim() !== "") site[k] = saved[k].trim();
  site.phoneHref = "tel:" + site.phone.replace(/[^\d+]/g, "");
  site.phone2Href = site.phone2 ? "tel:" + site.phone2.replace(/[^\d+]/g, "") : "";
  site.popularList = site.popular.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
  site.benefits = [1, 2, 3, 4].map((i) => ({ title: site[`benefit${i}Title`], text: site[`benefit${i}Text`] }));
  return site;
});

export const getPages = cache(async () => {
  const saved = await readJson("pages");
  const pages = { ...DEFAULT_PAGES };
  for (const k of ["about", "delivery", "warranty"]) if (typeof saved[k] === "string" && saved[k].trim() !== "") pages[k] = saved[k];
  if (Array.isArray(saved.faq) && saved.faq.length) pages.faq = saved.faq.filter((f) => f && f.q && f.a);
  return pages;
});

export async function saveSetting(key, value) {
  const json = JSON.stringify(value);
  await prisma.setting.upsert({ where: { key }, update: { value: json }, create: { key, value: json } });
}
