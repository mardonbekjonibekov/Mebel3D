const phone = process.env.SITE_PHONE || "+998 90 123 45 67";

export const SITE = {
  name: process.env.SITE_NAME || "Mebel3D",
  phone,
  phoneHref: "tel:" + phone.replace(/[^\d+]/g, ""),
  telegram: process.env.SITE_TELEGRAM || "https://t.me/mebel3d",
  address: process.env.SITE_ADDRESS || "Toshkent shahri",
};
