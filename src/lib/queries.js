import { prisma } from "@/lib/prisma";

export async function queryProducts({ categorySlug, q, sort, min, max, ar, sale, fw, fd, fh, color, material, instock, warranty, take } = {}) {
  const where = {};
  if (categorySlug) where.category = { slug: categorySlug };
  if (q) where.OR = [{ name: { contains: q } }, { description: { contains: q } }, { material: { contains: q } }];
  const price = {};
  if (Number.isFinite(min) && min > 0) price.gte = min;
  if (Number.isFinite(max) && max > 0) price.lte = max;
  if (Object.keys(price).length) where.price = price;
  if (ar) where.glbUrl = { not: null };
  if (sale) where.oldPrice = { not: null };
  if (color) where.colors = { contains: `"name":${JSON.stringify(color)}` };
  if (material) where.material = material;
  if (instock) where.stock = "in";
  if (warranty) where.warrantyMonths = { not: null };
  if (fw > 0) where.width = { lte: fw };
  if (fd > 0) where.depth = { lte: fd };
  if (fh > 0) where.height = { lte: fh };

  const orderBy =
    sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" };

  return prisma.product.findMany({ where, orderBy, take, include: { category: true } });
}

export function parseFilters(sp) {
  const num = (v) => (v ? parseInt(v, 10) : undefined);
  return {
    q: sp.q?.toString().trim() || undefined,
    sort: sp.sort?.toString() || "new",
    min: num(sp.min),
    max: num(sp.max),
    ar: sp.ar === "1",
    sale: sp.sale === "1",
    color: sp.color?.toString() || undefined,
    material: sp.material?.toString() || undefined,
    instock: sp.instock === "1",
    warranty: sp.warranty === "1",
    fw: num(sp.fw),
    fd: num(sp.fd),
    fh: num(sp.fh),
  };
}
