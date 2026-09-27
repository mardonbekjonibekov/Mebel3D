export function friendlyError(err) {
  console.error("[api]", err);

  if (err?.name === "PrismaClientValidationError") {
    return "Server yangilanishi kerak: terminalda Ctrl+C bosib, `npm run dev` ni qayta ishga tushiring.";
  }
  if (err?.code === "P2025") return "Mahsulot topilmadi (o'chirib yuborilgan bo'lishi mumkin).";
  if (err?.code === "P2003") return "Tanlangan kategoriya topilmadi.";
  if (err?.code === "P2002") return "Bunday ma'lumot allaqachon mavjud.";
  if (err?.clientVersion || err?.code) return "Bazaga saqlashda xatolik. Terminaldagi xabarga qarang.";
  return err?.message || "Noma'lum xatolik yuz berdi";
}
