import { saveUpload } from "@/lib/upload";

const int = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};
const str = (v) => (v?.toString().trim() || null);

function parseColors(raw) {
  if (!raw) return null;
  let list;
  try {
    list = JSON.parse(raw);
  } catch {
    throw new Error("Ranglar formati noto'g'ri");
  }
  if (!Array.isArray(list)) throw new Error("Ranglar formati noto'g'ri");
  const clean = list
    .slice(0, 12)
    .map((c) => ({ name: String(c.name || "").trim().slice(0, 30), hex: String(c.hex || "") }))
    .filter((c) => c.name && /^#[0-9a-fA-F]{6}$/.test(c.hex));
  return clean.length ? JSON.stringify(clean) : null;
}

function parseParts(raw) {
  if (!raw) return null;
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return null;
    const ints = [...new Set(list.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < 200))];
    return ints.length ? JSON.stringify(ints) : null;
  } catch {
    return null;
  }
}

function parseList(json, fallback) {
  try {
    const v = JSON.parse(json || "null");
    if (Array.isArray(v) && v.length) return v;
  } catch {}
  return fallback ? [fallback] : [];
}

export async function parseProductForm(form, existing) {
  const name = form.get("name")?.toString().trim();
  const categoryId = form.get("categoryId")?.toString();
  const price = int(form.get("price"));
  if (!name || !categoryId || price === null) throw new Error("Nomi, narxi va kategoriya majburiy");

  const data = {
    name,
    categoryId,
    price,
    oldPrice: int(form.get("oldPrice")),
    description: form.get("description")?.toString().trim() || "",
    width: int(form.get("width")),
    depth: int(form.get("depth")),
    height: int(form.get("height")),
    material: str(form.get("material")),
    color: str(form.get("color")),
    featured: form.get("featured") === "on",
    warrantyMonths: int(form.get("warrantyMonths")),
    installmentMonths: int(form.get("installmentMonths")),
    stock: ["in", "order", "out"].includes(form.get("stock")) ? form.get("stock") : "in",
    leadDays: int(form.get("leadDays")),
    colors: parseColors(form.get("colors")?.toString()),
    colorParts: parseParts(form.get("colorParts")?.toString()),
  };

  for (const [field, [input, kind]] of Object.entries({ glbUrl: ["glb", "glb"], usdzUrl: ["usdz", "usdz"] })) {
    const file = form.get(input);
    if (file && file.size > 0) data[field] = await saveUpload(file, kind);
  }

  // Yangi .glb yuklanganda eski .usdz mos kelmay qoladi: iPhone uchun .glb dan qayta yasaladi
  if (data.glbUrl && !data.usdzUrl) data.usdzUrl = null;

  const orderRaw = form.get("imageOrder");
  const legacy = form.get("image");
  if (orderRaw !== null || form.getAll("newImages").length || (legacy && legacy.size > 0)) {
    const fresh = [];
    for (const f of form.getAll("newImages")) if (f && f.size > 0) fresh.push(await saveUpload(f, "image"));
    if (legacy && legacy.size > 0) fresh.unshift(await saveUpload(legacy, "image"));

    let order = [];
    try {
      order = JSON.parse(orderRaw || "null");
    } catch {}
    if (!Array.isArray(order)) order = [...(existing ? parseList(existing.images, existing.imageUrl) : []), ...fresh.map((_, i) => i)];

    const final = [];
    for (const token of order) {
      if (typeof token === "number" && fresh[token]) final.push(fresh[token]);
      else if (typeof token === "string" && /^\/(uploads\/images|products)\/[\w.-]+$/.test(token)) final.push(token);
    }
    fresh.forEach((u) => final.includes(u) || final.push(u));
    const images = [...new Set(final)].slice(0, 8);
    data.images = images.length ? JSON.stringify(images) : null;
    data.imageUrl = images[0] || null;
  }
  return data;
}
