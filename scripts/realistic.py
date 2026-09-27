"""More realistic versions of chairs, armchair, sofa, beds and the office chair."""
import math
from engine import rbox, tcyl, cushion_disc, lathe, box, bar

OAK_W = (0.62, 0.42, 0.24, 0, 0.7, "wood")
WALNUT_W = (0.33, 0.2, 0.12, 0, 0.65, "wood")
BEIGE_F = (0.84, 0.76, 0.64, 0, 0.95, "fabric")
BEIGE2_F = (0.9, 0.82, 0.7, 0, 0.95, "fabric")
TEAL_F = (0.13, 0.42, 0.46, 0, 0.95, "fabric")
TEAL2_F = (0.18, 0.5, 0.54, 0, 0.95, "fabric")
GRAY_F = (0.52, 0.55, 0.58, 0, 0.95, "fabric")
GRAY2_F = (0.6, 0.63, 0.66, 0, 0.95, "fabric")
WHITE_F = (0.94, 0.93, 0.91, 0, 0.95, "fabric")
NAVY_F = (0.14, 0.2, 0.38, 0, 0.95, "fabric")
TERRA_F = (0.76, 0.37, 0.22, 0, 0.95, "fabric")
PINK_F = (0.93, 0.62, 0.68, 0, 0.95, "fabric")
MINT_F = (0.55, 0.78, 0.68, 0, 0.95, "fabric")
BLACK_L = (0.11, 0.11, 0.12, 0, 0.45, "leather")
BLACK_FAB = (0.12, 0.12, 0.13, 0, 0.95, "fabric")
BLACK_M = (0.13, 0.13, 0.14, 0, 0.9, "mesh")
BLACK_P = (0.1, 0.1, 0.11, 0, 0.5)
CHROME = (0.78, 0.78, 0.8, 0.95, 0.22)
MUSTARD_P = (0.88, 0.63, 0.16, 0, 0.6)
WHITE_P = (0.94, 0.93, 0.91, 0, 0.5)


def chair():
    p = []
    for sx in (-1, 1):
        p.append(tcyl(sx * 0.19, 0.18, 0.012, 0.021, 0, 0.43, WALNUT_W))
        p.append(rbox(sx * 0.19, -0.19, 0.04, 0.036, 0, 0.9, WALNUT_W, r=0.014))
    p.append(rbox(0, 0.18, 0.36, 0.028, 0.2, 0.04, WALNUT_W, r=0.01))
    p.append(rbox(0, -0.19, 0.36, 0.028, 0.2, 0.04, WALNUT_W, r=0.01))
    for sx in (-1, 1):
        p.append(rbox(sx * 0.19, 0, 0.028, 0.34, 0.2, 0.04, WALNUT_W, r=0.01))
    p.append(rbox(0, 0, 0.44, 0.44, 0.41, 0.045, OAK_W, r=0.014))
    p.append(rbox(0, 0.01, 0.4, 0.4, 0.455, 0.065, BEIGE_F, r=0.03))
    p.append(rbox(0, -0.19, 0.36, 0.028, 0.63, 0.22, BEIGE_F, r=0.012))
    p.append(rbox(0, -0.19, 0.4, 0.034, 0.86, 0.05, OAK_W, r=0.016))
    p.append(rbox(0, -0.19, 0.36, 0.028, 0.55, 0.045, OAK_W, r=0.012))
    return p


def bar_stool():
    p = [cushion_disc(0, 0, 0.18, 0.66, 0.085, BLACK_L, rr=0.04),
         cushion_disc(0, 0, 0.15, 0.62, 0.04, CHROME, rr=0.012),
         tcyl(0, 0, 0.026, 0.026, 0.035, 0.585, CHROME),
         cushion_disc(0, 0, 0.21, 0, 0.038, CHROME, rr=0.014)]
    ring = [(0.15 + 0.012 * math.cos(2 * math.pi * i / 10), 0.27 + 0.012 * math.sin(2 * math.pi * i / 10)) for i in range(10)]
    p.append(lathe(ring, 0, 0, CHROME, n=36, closed=True))
    for i in range(4):
        a = math.pi / 4 + i * math.pi / 2
        p.append(bar(0.02 * math.cos(a), 0.02 * math.sin(a), 0.15 * math.cos(a), 0.15 * math.sin(a), 0.016, 0.262, 0.016, CHROME))
    return p


def armchair():
    p = []
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.append(tcyl(sx * 0.35, sz * 0.31, 0.018, 0.03, 0, 0.16, WALNUT_W))
    p.append(rbox(0, 0, 0.86, 0.8, 0.14, 0.2, TEAL_F, r=0.05))
    for sx in (-1, 1):
        p.append(rbox(sx * 0.37, 0, 0.16, 0.8, 0.14, 0.38, TEAL_F, r=0.07))
    p.append(rbox(0, -0.33, 0.62, 0.15, 0.3, 0.52, TEAL_F, r=0.07))
    p.append(rbox(0, 0.04, 0.56, 0.56, 0.32, 0.15, TEAL2_F, r=0.055))
    p.append(rbox(0, -0.22, 0.54, 0.11, 0.42, 0.34, TEAL2_F, r=0.05))
    return p


def sofa():
    p = []
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.append(tcyl(sx * 0.98, sz * 0.34, 0.02, 0.034, 0, 0.14, WALNUT_W))
    p.append(rbox(0, 0, 2.2, 0.9, 0.13, 0.24, GRAY_F, r=0.05))
    for sx in (-1, 1):
        p.append(rbox(sx * 1.0, 0, 0.2, 0.9, 0.13, 0.5, GRAY_F, r=0.075))
    p.append(rbox(0, -0.34, 1.8, 0.22, 0.3, 0.5, GRAY_F, r=0.08))
    for x in (-0.6, 0, 0.6):
        p.append(rbox(x, 0.09, 0.59, 0.66, 0.37, 0.16, GRAY2_F, r=0.06))
        p.append(rbox(x, -0.17, 0.59, 0.2, 0.52, 0.34, GRAY2_F, r=0.075))
    p.append(rbox(-0.72, 0.1, 0.4, 0.13, 0.55, 0.4, TERRA_F, r=0.05))
    return p


def bed():
    p = []
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.append(tcyl(sx * 0.77, sz * 0.96, 0.025, 0.04, 0, 0.16, WALNUT_W))
    p.append(rbox(0, 0, 1.66, 2.02, 0.15, 0.2, WALNUT_W, r=0.02))
    p.append(rbox(0, -1.0, 1.72, 0.1, 0.15, 0.96, BEIGE_F, r=0.045))
    for x in (-0.56, 0, 0.56):
        p.append(rbox(x, -0.935, 0.5, 0.05, 0.42, 0.55, BEIGE2_F, r=0.022))
        for yy in (0.52, 0.76, 0.9):
            p.append(rbox(x, -0.905, 0.035, 0.02, yy - 0.03, 0.035, BEIGE_F, r=0.016))
    p.append(rbox(0, 0.02, 1.58, 2.0, 0.36, 0.26, WHITE_F, r=0.07))
    for x in (-0.4, 0.4):
        p.append(rbox(x, -0.72, 0.66, 0.4, 0.6, 0.13, WHITE_F, r=0.06))
    p.append(rbox(0, 0.42, 1.6, 1.25, 0.6, 0.05, NAVY_F, r=0.025))
    for sx in (-1, 1):
        p.append(rbox(sx * 0.8, 0.42, 0.05, 1.25, 0.4, 0.25, NAVY_F, r=0.022))
    p.append(rbox(0, 1.0, 1.72, 0.08, 0.15, 0.32, WALNUT_W, r=0.02))
    return p


def kids_bed():
    p = []
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.append(tcyl(sx * 0.4, sz * 0.9, 0.025, 0.035, 0, 0.12, MUSTARD_P))
    p.append(rbox(0, 0, 0.9, 1.9, 0.11, 0.18, MUSTARD_P, r=0.03))
    p.append(rbox(0, 0.01, 0.84, 1.82, 0.29, 0.16, WHITE_F, r=0.05))
    p.append(rbox(0, -0.93, 0.92, 0.06, 0.11, 0.78, PINK_F, r=0.04))
    p.append(rbox(0, 0.93, 0.92, 0.06, 0.11, 0.46, PINK_F, r=0.04))
    for sx in (-1, 1):
        p.append(rbox(sx * 0.44, 0.15, 0.035, 1.1, 0.5, 0.04, MUSTARD_P, r=0.015))
        for k in range(8):
            p.append(rbox(sx * 0.44, -0.33 + k * 0.14, 0.022, 0.022, 0.3, 0.2, MUSTARD_P, r=0.01))
    p.append(rbox(0, -0.62, 0.5, 0.3, 0.45, 0.1, MINT_F, r=0.05))
    p.append(rbox(0, 0.28, 0.82, 1.0, 0.45, 0.05, MINT_F, r=0.025))
    return p


def office_chair():
    p = []
    for i in range(5):
        a = i * 2 * math.pi / 5 + 0.3
        ex, ez = math.cos(a) * 0.3, math.sin(a) * 0.3
        p.append(bar(0, 0, ex, ez, 0.05, 0.05, 0.03, BLACK_P))
        p.append(cushion_disc(ex, ez, 0.03, 0, 0.05, BLACK_P, rr=0.012, n=14))
    p.append(cushion_disc(0, 0, 0.065, 0.05, 0.04, BLACK_P, rr=0.015))
    p.append(tcyl(0, 0, 0.03, 0.03, 0.09, 0.3, CHROME))
    p.append(rbox(0, 0, 0.3, 0.3, 0.39, 0.04, BLACK_P, r=0.015))
    p.append(rbox(0, 0.02, 0.52, 0.5, 0.43, 0.1, BLACK_FAB, r=0.04))
    p.append(rbox(0, -0.22, 0.06, 0.06, 0.43, 0.2, BLACK_P, r=0.02))
    p.append(rbox(0, -0.26, 0.5, 0.04, 0.58, 0.5, BLACK_P, r=0.02))
    p.append(rbox(0, -0.245, 0.42, 0.02, 0.63, 0.4, BLACK_M, r=0.008))
    p.append(rbox(0, -0.235, 0.44, 0.05, 0.6, 0.11, BLACK_FAB, r=0.025))
    p.append(rbox(0, -0.26, 0.03, 0.03, 1.06, 0.06, CHROME, r=0.012))
    p.append(rbox(0, -0.265, 0.28, 0.06, 1.0, 0.15, BLACK_FAB, r=0.03))
    for sx in (-1, 1):
        p.append(rbox(sx * 0.29, -0.02, 0.05, 0.3, 0.72, 0.035, BLACK_P, r=0.016))
        p.append(rbox(sx * 0.29, -0.06, 0.03, 0.03, 0.52, 0.2, CHROME, r=0.012))
    return p


RECOLOR = {
    "stul-klassik": [BEIGE_F],
    "bar-stuli-loft": [BLACK_L],
    "kreslo-relax": [TEAL_F, TEAL2_F],
    "divan-comfort": [GRAY_F, GRAY2_F],
    "krevat-royal": [BEIGE_F, BEIGE2_F],
    "bolalar-krevati-sweet": [MUSTARD_P],
    "ofis-kreslosi-ergo": [BLACK_FAB],
}

FN = {
    "stul-klassik": chair,
    "bar-stuli-loft": bar_stool,
    "kreslo-relax": armchair,
    "divan-comfort": sofa,
    "krevat-royal": bed,
    "bolalar-krevati-sweet": kids_bed,
    "ofis-kreslosi-ergo": office_chair,
}
