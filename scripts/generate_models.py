#!/usr/bin/env python3
"""Procedurally generates furniture .glb, .usdz and isometric .svg previews + prisma/catalog.json."""
import json, math, os, struct, zlib
from engine import all_tris, write_glb, write_usdz
import realistic

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, "public", "models")
IMAGES = os.path.join(ROOT, "public", "products")
os.makedirs(MODELS, exist_ok=True)
os.makedirs(IMAGES, exist_ok=True)

# colour = (r, g, b, metallic, roughness)
OAK = (0.62, 0.42, 0.24, 0, 0.7)
WALNUT = (0.33, 0.2, 0.12, 0, 0.65)
WHITE = (0.94, 0.93, 0.91, 0, 0.6)
BLACK = (0.11, 0.11, 0.12, 0, 0.5)
GRAY = (0.52, 0.55, 0.58, 0, 0.9)
BEIGE = (0.84, 0.76, 0.64, 0, 0.9)
TEAL = (0.13, 0.42, 0.46, 0, 0.9)
MUSTARD = (0.88, 0.63, 0.16, 0, 0.8)
METAL = (0.72, 0.72, 0.75, 0.85, 0.35)
NAVY = (0.14, 0.2, 0.38, 0, 0.9)
TERRA = (0.76, 0.37, 0.22, 0, 0.85)
PINK = (0.93, 0.62, 0.68, 0, 0.85)
STEEL = (0.36, 0.42, 0.5, 0.6, 0.45)
MINT = (0.55, 0.78, 0.68, 0, 0.8)
GRAY2 = (0.6, 0.63, 0.66, 0, 0.9)
TEAL2 = (0.18, 0.5, 0.54, 0, 0.9)
OAK2 = (0.7, 0.5, 0.3, 0, 0.7)
STEEL2 = (0.44, 0.5, 0.58, 0.6, 0.45)


def box(x, z, w, d, y0, h, c):
    return dict(pts=[(x - w / 2, z - d / 2), (x + w / 2, z - d / 2), (x + w / 2, z + d / 2), (x - w / 2, z + d / 2)],
                y0=y0, y1=y0 + h, c=c, smooth=False)


def cyl(x, z, r, y0, h, c, n=24):
    pts = [(x + r * math.cos(2 * math.pi * i / n), z + r * math.sin(2 * math.pi * i / n)) for i in range(n)]
    return dict(pts=pts, y0=y0, y1=y0 + h, c=c, smooth=True)


def legs4(w, d, inset, y0, h, size, c):
    return [box(sx * (w / 2 - inset), sz * (d / 2 - inset), size, size, y0, h, c) for sx in (-1, 1) for sz in (-1, 1)]


# ---------------------------------------------------------------- furniture
def dining_table():
    return [*legs4(1.6, 0.9, 0.08, 0, 0.72, 0.07, WALNUT), box(0, 0, 1.6, 0.9, 0.72, 0.04, OAK),
            box(0, 0, 1.3, 0.05, 0.62, 0.1, WALNUT)]


def round_table():
    return [cyl(0, 0, 0.3, 0, 0.04, METAL), cyl(0, 0, 0.06, 0.04, 0.68, METAL), cyl(0, 0, 0.55, 0.72, 0.04, WHITE, 40)]


def writing_desk():
    return [*legs4(1.3, 0.6, 0.05, 0, 0.72, 0.04, BLACK), box(0, 0, 1.3, 0.6, 0.72, 0.03, WHITE),
            box(0.45, 0, 0.36, 0.5, 0.3, 0.42, OAK), box(0.45, 0.255, 0.32, 0.01, 0.55, 0.14, WALNUT),
            box(0.45, 0.255, 0.32, 0.01, 0.36, 0.14, WALNUT)]


def chair():
    parts = legs4(0.42, 0.42, 0.03, 0, 0.45, 0.04, WALNUT)
    parts += [box(0, 0, 0.44, 0.44, 0.45, 0.04, OAK), box(0, 0.01, 0.4, 0.4, 0.49, 0.05, BEIGE)]
    parts += [box(-0.18, -0.19, 0.04, 0.04, 0.49, 0.43, WALNUT), box(0.18, -0.19, 0.04, 0.04, 0.49, 0.43, WALNUT)]
    parts += [box(0, -0.19, 0.4, 0.03, 0.72, 0.2, BEIGE), box(0, -0.19, 0.36, 0.02, 0.66, 0.04, OAK)]
    return parts


def bar_stool():
    return [cyl(0, 0, 0.2, 0, 0.03, METAL), cyl(0, 0, 0.022, 0.03, 0.63, METAL),
            cyl(0, 0, 0.13, 0.28, 0.02, METAL), cyl(0, 0, 0.18, 0.66, 0.07, BLACK)]


def sofa():
    p = [cyl(sx * 1.0, sz * 0.36, 0.035, 0, 0.14, WALNUT, 12) for sx in (-1, 1) for sz in (-1, 1)]
    p += [box(0, 0, 2.2, 0.9, 0.14, 0.28, GRAY)]
    p += [box(sx * 1.0, 0, 0.2, 0.9, 0.14, 0.52, GRAY) for sx in (-1, 1)]
    p += [box(0, -0.36, 1.8, 0.18, 0.42, 0.42, GRAY)]
    p += [box(x, 0.1, 0.6, 0.66, 0.42, 0.13, GRAY2) for x in (-0.6, 0, 0.6)]
    p += [box(x, -0.22, 0.58, 0.16, 0.55, 0.3, GRAY2) for x in (-0.6, 0, 0.6)]
    p += [box(-0.78, 0.15, 0.32, 0.12, 0.56, 0.3, TERRA)]
    return p


def armchair():
    p = [cyl(sx * 0.34, sz * 0.32, 0.03, 0, 0.14, WALNUT, 12) for sx in (-1, 1) for sz in (-1, 1)]
    p += [box(0, 0, 0.9, 0.85, 0.14, 0.26, TEAL)]
    p += [box(sx * 0.4, 0, 0.16, 0.85, 0.14, 0.5, TEAL) for sx in (-1, 1)]
    p += [box(0, -0.33, 0.7, 0.18, 0.4, 0.5, TEAL)]
    p += [box(0, 0.06, 0.62, 0.62, 0.4, 0.13, TEAL2)]
    return p


def wardrobe():
    p = [box(0, 0, 1.8, 0.55, 0.06, 2.1, WHITE), box(0, 0, 1.7, 0.45, 0, 0.06, WALNUT)]
    for i, x in enumerate((-0.6, 0, 0.6)):
        p.append(box(x, 0.285, 0.57, 0.02, 0.1, 1.98, OAK if i != 1 else OAK2))
    p += [box(-0.3, 0.31, 0.02, 0.02, 0.95, 0.3, BLACK), box(0.3, 0.31, 0.02, 0.02, 0.95, 0.3, BLACK),
          box(-0.02, 0.31, 0.02, 0.02, 0.95, 0.3, BLACK), box(0.02, 0.31, 0.02, 0.02, 0.95, 0.3, BLACK)]
    return p


def bookshelf():
    p = [box(-0.435, 0, 0.03, 0.3, 0, 1.9, OAK), box(0.435, 0, 0.03, 0.3, 0, 1.9, OAK), box(0, -0.14, 0.9, 0.02, 0, 1.9, WALNUT)]
    palette = [TERRA, NAVY, MUSTARD, TEAL, WHITE, PINK, MINT, GRAY]
    k = 0
    for i in range(6):
        y = i * 0.37
        p.append(box(0, 0, 0.84, 0.3, y, 0.03, OAK))
        if i < 5:
            x = -0.38
            while x < 0.34:
                w = 0.04 + (k * 7 % 5) * 0.012
                h = 0.22 + (k * 3 % 4) * 0.03
                if k % 6 != 5:
                    p.append(box(x + w / 2, 0.0, w, 0.2, y + 0.03, h, palette[k % len(palette)]))
                x += w + 0.004
                k += 1
    p.append(box(0, 0, 0.9, 0.3, 1.87, 0.03, OAK))
    return p


def tv_stand():
    p = legs4(1.6, 0.4, 0.06, 0, 0.12, 0.04, METAL)
    p += [box(0, 0, 1.6, 0.4, 0.12, 0.4, WALNUT), box(0, 0, 1.64, 0.42, 0.52, 0.03, OAK)]
    p += [box(x, 0.205, 0.4, 0.01, 0.15, 0.32, OAK) for x in (-0.6, -0.2, 0.2, 0.6)]
    p += [box(x, 0.215, 0.02, 0.02, 0.28, 0.06, BLACK) for x in (-0.6, -0.2, 0.2, 0.6)]
    return p


def bed():
    p = legs4(1.6, 2.05, 0.05, 0, 0.15, 0.08, WALNUT)
    p += [box(0, 0, 1.6, 2.05, 0.15, 0.25, WALNUT), box(0, 0.02, 1.52, 1.95, 0.4, 0.2, WHITE)]
    p += [box(0, -1.0, 1.7, 0.09, 0.15, 1.0, BEIGE), box(0, -0.95, 1.5, 0.03, 0.55, 0.5, (0.9, 0.82, 0.7, 0, 0.9))]
    p += [box(-0.4, -0.7, 0.62, 0.36, 0.6, 0.12, WHITE), box(0.4, -0.7, 0.62, 0.36, 0.6, 0.12, WHITE)]
    p += [box(0, 0.4, 1.54, 1.15, 0.6, 0.04, NAVY), box(0, 0.98, 1.54, 0.09, 0.15, 0.4, WALNUT)]
    return p


def kids_bed():
    p = legs4(0.9, 1.9, 0.04, 0, 0.12, 0.06, WALNUT)
    p += [box(0, 0, 0.9, 1.9, 0.12, 0.2, MUSTARD), box(0, 0, 0.84, 1.82, 0.32, 0.16, WHITE)]
    p += [box(0, -0.93, 0.92, 0.05, 0.12, 0.75, PINK), box(0, 0.93, 0.92, 0.05, 0.12, 0.45, PINK)]
    p += [box(0, -0.6, 0.5, 0.3, 0.48, 0.1, MINT)]
    p += [box(sx * 0.44, 0.2, 0.03, 1.1, 0.48, 0.18, MUSTARD) for sx in (-1, 1)]
    return p


def office_chair():
    p = [cyl(0, 0, 0.3, 0.04, 0.035, BLACK, 5), cyl(0, 0, 0.035, 0.075, 0.33, METAL)]
    p += [cyl(math.cos(a) * 0.27, math.sin(a) * 0.27, 0.035, 0, 0.05, BLACK, 10) for a in [i * 2 * math.pi / 5 for i in range(5)]]
    p += [box(0, 0, 0.52, 0.5, 0.42, 0.09, BLACK), box(0, -0.24, 0.48, 0.07, 0.56, 0.5, STEEL), box(0, -0.245, 0.4, 0.05, 0.62, 0.42, BLACK)]
    p += [box(0, -0.25, 0.28, 0.06, 1.05, 0.16, BLACK)]
    p += [box(sx * 0.29, -0.02, 0.05, 0.3, 0.6, 0.04, BLACK) for sx in (-1, 1)]
    p += [box(sx * 0.29, 0.08, 0.03, 0.03, 0.5, 0.1, METAL) for sx in (-1, 1)]
    return p


def computer_desk():
    p = [box(sx * 0.66, 0, 0.04, 0.68, 0, 0.74, BLACK) for sx in (-1, 1)]
    p += [box(0, 0, 1.4, 0.7, 0.74, 0.03, OAK), box(0, -0.3, 1.28, 0.03, 0.3, 0.44, BLACK)]
    p += [box(0, -0.31, 1.3, 0.3, 1.05, 0.03, OAK), box(-0.6, -0.22, 0.03, 0.02, 0.77, 0.28, BLACK), box(0.6, -0.22, 0.03, 0.02, 0.77, 0.28, BLACK)]
    p += [box(0.45, 0.02, 0.36, 0.5, 0.42, 0.02, OAK), box(0.45, 0.02, 0.36, 0.02, 0.5, 0.08, WALNUT)]
    return p


def office_cabinet():
    p = [box(0, 0, 0.9, 0.4, 0.04, 1.8, STEEL), box(0, 0, 0.86, 0.36, 0, 0.04, BLACK)]
    for i in range(4):
        p.append(box(0, 0.205, 0.84, 0.01, 0.08 + i * 0.44, 0.4, STEEL2))
        p.append(box(0, 0.22, 0.24, 0.02, 0.32 + i * 0.44, 0.03, BLACK))
    return p


CATALOG = [
    dict(slug="oshxona-stoli-milano", cat="stollar", name="Oshxona stoli Milano", price=2450000, old=2900000, w=160, d=90, h=76,
         material="Emandan yasalgan (dub)", color="Tabiiy yog'och", featured=True, fn=dining_table, bg=("#fdeed9", "#f7d6b0"),
         desc="Katta oilaviy davra uchun 6 kishilik oshxona stoli. Mustahkam dub yog'ochi, tabiiy lak bilan qoplangan, yuzasi chizilishga chidamli."),
    dict(slug="yumaloq-stol-luna", cat="stollar", name="Yumaloq stol Luna", price=1750000, old=None, w=110, d=110, h=76,
         material="MDF + metall", color="Oq / kumush", featured=False, fn=round_table, bg=("#e8f1fb", "#cfe0f5"),
         desc="Zamonaviy yumaloq stol, metall ustunli. Mehmonxona va oshxona uchun mos, ixcham va chiroyli."),
    dict(slug="yozuv-stoli-nordic", cat="stollar", name="Yozuv stoli Nordic", price=1290000, old=1490000, w=130, d=60, h=75,
         material="LDSP + metall oyoqlar", color="Oq / qora", featured=False, fn=writing_desk, bg=("#eef3ea", "#d5e3cc"),
         desc="Skandinaviya uslubidagi yozuv stoli. O'ng tomonda ikkita tortmali tumba bor, uy va o'quv uchun qulay."),
    dict(slug="stul-klassik", cat="stullar", name="Stul Klassik", price=490000, old=590000, w=45, d=45, h=92,
         material="Yog'och + yumshoq mato", color="Bej / yong'oq", featured=False, fn=chair, bg=("#f9ece4", "#f0cfba"),
         desc="Klassik uslubdagi yumshoq o'rindiqli stul. Yog'och ramkasi mustahkam, orqa suyanchig'i qulay."),
    dict(slug="bar-stuli-loft", cat="stullar", name="Bar stuli Loft", price=390000, old=None, w=40, d=40, h=72,
         material="Metall + eko-charm", color="Qora / kumush", featured=False, fn=bar_stool, bg=("#ececf3", "#d3d3e4"),
         desc="Loft uslubidagi bar stuli. Metall poydevor, yumshoq qora o'rindiq — oshxona orolchasi uchun ideal."),
    dict(slug="divan-comfort", cat="divanlar", name="Divan Comfort 3 o'rinli", price=6900000, old=7900000, w=220, d=90, h=85,
         material="Mato + yog'och karkas", color="Kulrang", featured=True, fn=sofa, bg=("#e9edf1", "#cbd4dd"),
         desc="Uch kishilik yumshoq divan. Chuqur o'rindiqlar, qulay suyanchiqlar va bezak yostiq bilan. Mehmonxona uchun tanlov."),
    dict(slug="kreslo-relax", cat="divanlar", name="Kreslo Relax", price=2350000, old=None, w=90, d=85, h=82,
         material="Baxmal mato", color="Zumrad yashil", featured=False, fn=armchair, bg=("#e2f2f1", "#bfe1de"),
         desc="Dam olish uchun qulay kreslo. Yumshoq baxmal mato va chiroyli yog'och oyoqlar."),
    dict(slug="kiyim-shkafi-grand", cat="shkaflar", name="Kiyim shkafi Grand 3 eshikli", price=5200000, old=5900000, w=180, d=55, h=215,
         material="LDSP + MDF fasad", color="Oq / eman", featured=True, fn=wardrobe, bg=("#f5f1ea", "#e6dccb"),
         desc="Katta sig'imli uch eshikli shkaf. Ichida javonlar va kiyim osish shtangasi bor. Yopiq eshiklar, zamonaviy dastalar."),
    dict(slug="kitob-javoni-library", cat="shkaflar", name="Kitob javoni Library", price=1480000, old=None, w=90, d=30, h=190,
         material="Yog'och", color="Eman", featured=False, fn=bookshelf, bg=("#f7ecdc", "#ecd3ad"),
         desc="Olti qavatli ochiq kitob javoni. Kitoblar, gullar va bezaklar uchun keng joy."),
    dict(slug="tv-tumba-modern", cat="shkaflar", name="TV tumba Modern", price=1650000, old=1890000, w=160, d=40, h=55,
         material="MDF + metall oyoqlar", color="Yong'oq", featured=False, fn=tv_stand, bg=("#efe6df", "#dcc8b8"),
         desc="Televizor uchun past tumba, to'rtta eshikchali. Simlar uchun teshik va metall oyoqlar."),
    dict(slug="krevat-royal", cat="krevatlar", name="Ikki kishilik krevat Royal", price=6400000, old=7400000, w=170, d=210, h=110,
         material="Yog'och + yumshoq bosh qismi", color="Yong'oq / bej", featured=True, fn=bed, bg=("#eee9f5", "#d8cfe8"),
         desc="Yumshoq bosh qismli ikki kishilik krevat. Matras uchun 160x200 sm o'lcham. Yotoqxonaga hashamat beradi."),
    dict(slug="bolalar-krevati-sweet", cat="krevatlar", name="Bolalar krevati Sweet", price=1950000, old=None, w=90, d=190, h=80,
         material="Yog'och + LDSP", color="Sariq / pushti", featured=False, fn=kids_bed, bg=("#fff1d9", "#fbdba0"),
         desc="Bolalar uchun xavfsiz krevat, yon to'siqlari bilan. Yorqin ranglar bolaga yoqadi."),
    dict(slug="ofis-kreslosi-ergo", cat="ofis-mebeli", name="Ofis kreslosi Ergo", price=1900000, old=2300000, w=65, d=65, h=115,
         material="To'r mato + plastik", color="Qora", featured=True, fn=office_chair, bg=("#e3e8ef", "#c5cfdd"),
         desc="Ergonomik ofis kreslosi. Balandligi sozlanadi, bel qismi qo'llab-quvvatlaydi, ko'p soat ishlash uchun qulay."),
    dict(slug="kompyuter-stoli-pro", cat="ofis-mebeli", name="Kompyuter stoli Pro", price=1350000, old=None, w=140, d=70, h=105,
         material="LDSP + metall", color="Eman / qora", featured=False, fn=computer_desk, bg=("#ebeef3", "#d2d9e4"),
         desc="Kompyuter uchun keng stol, tepasida javon va tagida klaviatura joyi bor. Ish joyini tartibli saqlaydi."),
    dict(slug="ofis-shkafi", cat="ofis-mebeli", name="Ofis shkafi Steel", price=2100000, old=None, w=90, d=40, h=180,
         material="Metall", color="Kulrang-ko'k", featured=False, fn=office_cabinet, bg=("#e5edf2", "#c4d6e1"),
         desc="Hujjatlar uchun to'rt eshikli metall shkaf. Mustahkam va ixcham, ofis va do'kon uchun."),
]


RECOLOR = {
    "oshxona-stoli-milano": [OAK],
    "yumaloq-stol-luna": [WHITE],
    "yozuv-stoli-nordic": [WHITE, OAK],
    "stul-klassik": [BEIGE],
    "bar-stuli-loft": [BLACK],
    "divan-comfort": [GRAY, GRAY2],
    "kreslo-relax": [TEAL, TEAL2],
    "kiyim-shkafi-grand": [OAK, OAK2],
    "kitob-javoni-library": [OAK],
    "tv-tumba-modern": [WALNUT],
    "krevat-royal": [WALNUT],
    "bolalar-krevati-sweet": [MUSTARD],
    "ofis-kreslosi-ergo": [BLACK],
    "kompyuter-stoli-pro": [OAK],
    "ofis-shkafi": [STEEL, STEEL2],
}

RECOLOR.update(realistic.RECOLOR)
for _it in CATALOG:
    if _it["slug"] in realistic.FN:
        _it["fn"] = realistic.FN[_it["slug"]]

COLORS = {
    "stollar": [("Eman", "#a67c52"), ("Yong'oq", "#5c3d2e"), ("Oq", "#f1efe9"), ("Qora", "#1c1c1e")],
    "stullar": [("Eman", "#a67c52"), ("Yong'oq", "#5c3d2e"), ("Oq", "#f1efe9"), ("Qora", "#1c1c1e")],
    "divanlar": [("Kulrang", "#8b9096"), ("Ko'k", "#2f4a7a"), ("Yashil", "#3f6b5c"), ("Bej", "#d6c3a3"), ("Qora", "#232326")],
    "shkaflar": [("Oq", "#f1efe9"), ("Jigarrang", "#7a4b2a"), ("Qora", "#1f1f21"), ("Kulrang", "#8b9096")],
    "krevatlar": [("Yong'oq", "#5c3d2e"), ("Oq", "#f1efe9"), ("Bej", "#d6c3a3"), ("Kulrang", "#8b9096")],
    "ofis-mebeli": [("Qora", "#1f1f21"), ("Kulrang", "#8b9096"), ("Oq", "#f1efe9")],
}


def main():
    meta = []
    for item in CATALOG:
        prisms = item["fn"]()
        write_glb(os.path.join(MODELS, item["slug"] + ".glb"), prisms)
        write_usdz(os.path.join(MODELS, item["slug"] + ".usdz"), prisms)
        order = list(all_tris(prisms).keys())
        parts = [i for i, k in enumerate(order) if k in RECOLOR[item["slug"]]]
        meta.append(dict(slug=item["slug"], colorParts=parts, category=item["cat"], name=item["name"], description=item["desc"], price=item["price"],
                         oldPrice=item["old"], width=item["w"], depth=item["d"], height=item["h"], material=item["material"],
                         color=item["color"], colors=[dict(name=n, hex=h) for n, h in COLORS[item["cat"]]], featured=item["featured"], imageUrl=f"/products/{item['slug']}.jpg",
                         glbUrl=f"/models/{item['slug']}.glb", usdzUrl=f"/models/{item['slug']}.usdz"))
    with open(os.path.join(ROOT, "prisma", "catalog.json"), "w") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("generated", len(meta), "products")


if __name__ == "__main__":
    main()
