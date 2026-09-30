import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queryProducts } from "@/lib/queries";
import { parseJson } from "@/lib/recolor";
import { parseAiQuery } from "@/lib/aiSearch";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const text = (body?.text || "").toString().trim().slice(0, 300);
  if (!text) return NextResponse.json({ error: "Savolingizni yozing" }, { status: 400 });

  const [categories, facetRows] = await Promise.all([
    prisma.category.findMany({ select: { name: true, slug: true } }),
    prisma.product.findMany({ select: { colors: true, material: true } }),
  ]);

  const colorSet = new Set();
  const materialSet = new Set();
  for (const r of facetRows) {
    for (const c of parseJson(r.colors, [])) if (c?.name) colorSet.add(c.name);
    if (r.material) materialSet.add(r.material);
  }

  const filters = parseAiQuery(text, { categories, colors: [...colorSet], materials: [...materialSet] });
  const understood = Boolean(
    filters.categorySlug || filters.color || filters.material || filters.min || filters.max || filters.q
  );
  const products = understood ? await queryProducts({ ...filters, take: 6 }) : [];

  const query = new URLSearchParams();
  if (filters.min) query.set("min", filters.min);
  if (filters.max) query.set("max", filters.max);
  if (filters.color) query.set("color", filters.color);
  if (filters.material) query.set("material", filters.material);
  if (filters.q) query.set("q", filters.q);
  if (filters.ar) query.set("ar", "1");
  if (filters.sale) query.set("sale", "1");
  if (filters.instock) query.set("instock", "1");
  if (filters.warranty) query.set("warranty", "1");
  const qs = query.toString();
  const catalogHref = (filters.categorySlug ? `/catalog/${filters.categorySlug}` : "/catalog") + (qs ? `?${qs}` : "");

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      oldPrice: p.oldPrice,
      imageUrl: p.imageUrl,
      glbUrl: p.glbUrl,
      usdzUrl: p.usdzUrl,
      colors: p.colors,
      colorParts: p.colorParts,
      stock: p.stock,
      leadDays: p.leadDays,
      warrantyMonths: p.warrantyMonths,
      installmentMonths: p.installmentMonths,
      category: p.category ? { name: p.category.name } : null,
    })),
    matched: {
      category: filters.categoryName,
      color: filters.color,
      material: filters.material,
      min: filters.min,
      max: filters.max,
    },
    understood,
    catalogHref,
  });
}
