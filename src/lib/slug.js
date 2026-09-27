const CYR = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h" };

export function slugify(name) {
  const base = String(name || "")
    .toLowerCase()
    .replace(/[ʻʼ`´’']/g, "")
    .split("")
    .map((c) => (c in CYR ? CYR[c] : c))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "kategoriya";
}

export async function uniqueSlug(prisma, name, ignoreId) {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; ; i++) {
    const found = await prisma.category.findUnique({ where: { slug } });
    if (!found || found.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
}
