const { PrismaClient } = require("@prisma/client");
const catalog = require("./catalog.json");

const prisma = new PrismaClient();

const categories = [
  { name: "Stollar", slug: "stollar" },
  { name: "Stullar", slug: "stullar" },
  { name: "Divanlar", slug: "divanlar" },
  { name: "Shkaflar", slug: "shkaflar" },
  { name: "Krevatlar", slug: "krevatlar" },
  { name: "Ofis mebeli", slug: "ofis-mebeli" },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  await prisma.product.deleteMany({ where: { name: "Ofis kreslosi" } });

  for (const item of catalog) {
    const category = await prisma.category.findUnique({ where: { slug: item.category } });
    const { slug, category: _c, ...rest } = item;
    const data = { ...rest, colors: JSON.stringify(rest.colors || []), categoryId: category.id };
    const existing = await prisma.product.findFirst({ where: { name: item.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
    } else {
      await prisma.product.create({ data });
    }
  }
  console.log("Tayyor:", categories.length, "kategoriya,", catalog.length, "mahsulot");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
