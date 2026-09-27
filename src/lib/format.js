export function formatPrice(price) {
  return String(Math.round(price)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}

export function discountPercent(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function installmentPrice(price, months) {
  if (!months || months < 2) return null;
  return Math.ceil(price / months / 1000) * 1000;
}

export function warrantyLabel(months) {
  if (!months) return null;
  return months % 12 === 0 ? `${months / 12} yil` : `${months} oy`;
}

export const STOCK = {
  in: { label: "Omborda bor", tone: "text-emerald-600 bg-emerald-50" },
  order: { label: "Buyurtma bilan", tone: "text-amber-700 bg-amber-50" },
  out: { label: "Tugagan", tone: "text-red-600 bg-red-50" },
};
