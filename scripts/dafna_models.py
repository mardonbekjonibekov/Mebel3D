#!/usr/bin/env python3
"""15 sample furniture models built to look like the real product photos (test data).
Run: python3 scripts/dafna_models.py   -> writes public/models/*.glb|usdz and updates prisma/catalog.json"""
import json, math, os
from engine import rbox, tcyl, cyl, box, lathe, cushion_disc, all_tris, write_glb, write_usdz, prism_tris, _emit, normalize

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, "public", "models")


def M(r, g, b, m=0, ro=0.7, tex=None, alpha=1):
    c = (r, g, b, m, ro, tex)
    return c + (alpha,) if alpha < 1 else (c if tex else (r, g, b, m, ro))


# ------------------------------------------------------------------ helpers
def tris_of(p):
    return p["tris"] if "tris" in p else prism_tris(p)


def rot(part, axis, deg, pivot=(0, 0, 0)):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)

    def r(v):
        x, y, z = v
        if axis == "x":
            return (x, y * c - z * s, y * s + z * c)
        if axis == "y":
            return (x * c + z * s, y, -x * s + z * c)
        return (x * c - y * s, x * s + y * c, z)

    def p(v):
        q = r((v[0] - pivot[0], v[1] - pivot[1], v[2] - pivot[2]))
        return (q[0] + pivot[0], q[1] + pivot[1], q[2] + pivot[2])

    out = [(p(a_), p(b_), p(c_), r(na), r(nb), r(nc), ua, ub, uc) for a_, b_, c_, na, nb, nc, ua, ub, uc in tris_of(part)]
    return dict(tris=out, c=part["c"])


def mv(part, dx=0, dy=0, dz=0):
    f = lambda v: (v[0] + dx, v[1] + dy, v[2] + dz)
    out = [(f(a_), f(b_), f(c_), na, nb, nc, ua, ub, uc) for a_, b_, c_, na, nb, nc, ua, ub, uc in tris_of(part)]
    return dict(tris=out, c=part["c"])


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def add(a, b):
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def mul(a, k):
    return (a[0] * k, a[1] * k, a[2] * k)


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def tube(p0, p1, r0, r1, c, n=12):
    ax = sub(p1, p0)
    a = normalize(ax)
    ref = (0, 1, 0) if abs(a[1]) < 0.9 else (1, 0, 0)
    u = normalize(cross(a, ref))
    v = cross(a, u)
    out = []
    ring = lambda p, r: [add(p, add(mul(u, r * math.cos(2 * math.pi * k / n)), mul(v, r * math.sin(2 * math.pi * k / n)))) for k in range(n)]
    d0, d1 = [add(mul(u, math.cos(2 * math.pi * k / n)), mul(v, math.sin(2 * math.pi * k / n))) for k in range(n)], None
    r0s, r1s = ring(p0, r0), ring(p1, r1)
    for k in range(n):
        j = (k + 1) % n
        _emit(out, r0s[k], r0s[j], r1s[j], d0[k], d0[j], d0[j])
        _emit(out, r0s[k], r1s[j], r1s[k], d0[k], d0[j], d0[k])
        _emit(out, p0, r0s[j], r0s[k], mul(a, -1), mul(a, -1), mul(a, -1))
        _emit(out, p1, r1s[k], r1s[j], a, a, a)
    return dict(tris=out, c=c)


def beam(p0, p1, w, h, c, up=(0, 1, 0)):
    """Rectangular bar from p0 to p1, section w (sideways) x h (along `up`)."""
    a = normalize(sub(p1, p0))
    if abs(sum(x * y for x, y in zip(a, up))) > 0.95:
        up = (1, 0, 0)
    s = normalize(cross(a, up))
    u = normalize(cross(s, a))
    cs = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
    P = []
    for base in (p0, p1):
        P.append([add(base, add(mul(s, sx * w / 2), mul(u, sy * h / 2))) for sx, sy in cs])
    mid = mul(add(p0, p1), 0.5)
    out = []

    def quad(q, nrm):
        _emit(out, q[0], q[1], q[2], nrm, nrm, nrm)
        _emit(out, q[0], q[2], q[3], nrm, nrm, nrm)

    for k in range(4):
        j = (k + 1) % 4
        q = [P[0][k], P[0][j], P[1][j], P[1][k]]
        cen = mul(add(add(q[0], q[1]), add(q[2], q[3])), 0.25)
        nrm = normalize(cross(sub(q[1], q[0]), sub(q[3], q[0])))
        if sum(x * y for x, y in zip(nrm, sub(cen, mid))) < 0:
            nrm = mul(nrm, -1)
        quad(q, nrm)
    quad(P[0], mul(a, -1))
    quad(P[1], a)
    return dict(tris=out, c=c)


def ring(x, z, R, r, y, c, n=40, m=10):
    """Torus ring of radius R, tube radius r, centred at height y."""
    prof = [(R + r * math.cos(2 * math.pi * i / m), y + r * math.sin(2 * math.pi * i / m)) for i in range(m)]
    return lathe(prof, x, z, c, n=n, closed=True)


def polyprism(pts, y0, h, c):
    return dict(pts=pts, y0=y0, y1=y0 + h, c=c, smooth=False)


# ------------------------------------------------------------------ 1. woven dining table (dark grey rattan, glass top)
def dining_table():
    W = M(0.27, 0.28, 0.3, 0, 0.85, "mesh")
    GL = M(0.6, 0.68, 0.68, 0.1, 0.1, None, 0.32)
    p = []
    w, d = 1.33, 0.93
    p.append(rbox(0, 0, w, d, 0.62, 0.1, W, r=0.03))
    p.append(rbox(0, 0, w + 0.02, d + 0.02, 0.72, 0.012, GL, r=0.004))
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.append(tube((sx * 0.6, 0.66, sz * 0.4), (sx * 0.68, 0.02, sz * 0.47), 0.05, 0.03, W, n=14))
            p.append(tcyl(sx * 0.64, sz * 0.44, 0.04, 0.045, 0, 0.03, W))
    # arched aprons under the long edges
    for sz in (-1, 1):
        p.append(rbox(0, sz * 0.42, 0.9, 0.035, 0.5, 0.13, W, r=0.012))
        p.append(rbox(0, sz * 0.42, 0.5, 0.03, 0.44, 0.07, W, r=0.01))
    for sx in (-1, 1):
        p.append(rbox(sx * 0.6, 0, 0.035, 0.55, 0.5, 0.13, W, r=0.012))
    return p, [W]


# ------------------------------------------------------------------ 2. round glass table with black rattan frame
def round_table():
    B = M(0.07, 0.07, 0.08, 0.2, 0.5)
    GL = M(0.66, 0.74, 0.72, 0.1, 0.08, None, 0.3)
    p = []
    p.append(cyl(0, 0, 0.5, 0.715, 0.01, GL, n=60))
    p.append(ring(0, 0, 0.5, 0.012, 0.708, B, n=60))
    p.append(ring(0, 0, 0.3, 0.008, 0.702, B, n=48))
    for k in range(10):
        a = 2 * math.pi * k / 10
        p.append(tube((0.02 * math.cos(a), 0.706, 0.02 * math.sin(a)), (0.5 * math.cos(a + 0.35), 0.706, 0.5 * math.sin(a + 0.35)), 0.007, 0.007, B, n=6))
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        p.append(tube((0.36 * math.cos(a), 0.7, 0.36 * math.sin(a)), (0.5 * math.cos(a), 0.015, 0.5 * math.sin(a)), 0.011, 0.011, B, n=8))
        p.append(tcyl(0.5 * math.cos(a), 0.5 * math.sin(a), 0.014, 0.012, 0, 0.02, B, n=10))
    p.append(ring(0, 0, 0.29, 0.007, 0.32, B, n=48))
    return p, [B]


# ------------------------------------------------------------------ 3. writing desk, walnut top + black Z frame
def writing_desk():
    WOOD = M(0.42, 0.33, 0.27, 0, 0.7, "wood")
    DRAW = M(0.36, 0.28, 0.23, 0, 0.7, "wood")
    BLK = M(0.07, 0.07, 0.08, 0.5, 0.45)
    p = [rbox(0, 0, 1.2, 0.6, 0.72, 0.03, WOOD, r=0.008)]
    p.append(rbox(0, 0.02, 1.16, 0.5, 0.66, 0.06, DRAW, r=0.006))
    p.append(rbox(0.12, 0.28, 0.9, 0.012, 0.665, 0.05, WOOD, r=0.004))
    p.append(rbox(0.12, 0.288, 0.14, 0.004, 0.69, 0.006, BLK, r=0.002))
    for sx in (-1, 1):
        x = sx * 0.54
        p.append(beam((x, 0.02, -0.3), (x, 0.02, 0.2), 0.03, 0.03, BLK))
        p.append(beam((x, 0.02, -0.28), (x, 0.7, 0.28), 0.03, 0.03, BLK))
        p.append(beam((x, 0.7, -0.2), (x, 0.7, 0.3), 0.03, 0.03, BLK))
        p.append(beam((x, 0.02, -0.28), (x, 0.7, -0.28), 0.03, 0.03, BLK))
    return p, [WOOD, DRAW]


# ------------------------------------------------------------------ 4. plastic stacking chair
def plastic_chair():
    P = M(0.78, 0.73, 0.56, 0, 0.55)
    D = M(0.6, 0.55, 0.4, 0, 0.6)
    p = []
    p.append(rbox(0, 0.02, 0.46, 0.46, 0.44, 0.035, P, r=0.016))
    # legs with a slight splay
    p.append(tube((-0.19, 0.45, 0.19), (-0.22, 0, 0.25), 0.016, 0.012, P, n=10))
    p.append(tube((0.19, 0.45, 0.19), (0.22, 0, 0.25), 0.016, 0.012, P, n=10))
    p.append(tube((-0.19, 0.45, -0.17), (-0.22, 0, -0.26), 0.016, 0.012, P, n=10))
    p.append(tube((0.19, 0.45, -0.17), (0.22, 0, -0.26), 0.016, 0.012, P, n=10))
    # backrest: wide rounded panel leaning back, round perforations
    piv = (0, 0.5, -0.2)
    p.append(rot(rbox(0, -0.2, 0.44, 0.03, 0.5, 0.34, P, r=0.03), "x", -8, piv))
    for sx in (-1, 1):
        p.append(rot(tube((sx * 0.2, 0.44, -0.2), (sx * 0.2, 0.62, -0.2), 0.013, 0.013, P, n=8), "x", -8, piv))
    for i in range(5):
        for j in range(6):
            x = -0.15 + j * 0.06 + (0.03 if i % 2 else 0)
            if abs(x) > 0.16:
                continue
            h = rot(cyl(0, 0, 0.0085, 0, 0.005, D, n=10), "x", 90)
            p.append(rot(mv(h, x, 0.56 + i * 0.05, -0.183), "x", -8, piv))
    return p, [P]


# ------------------------------------------------------------------ 5. black tufted bar stool
def bar_stool():
    CH = M(0.8, 0.8, 0.83, 0.95, 0.2)
    BK = M(0.09, 0.09, 0.1, 0, 0.9, "fabric")
    p = [lathe([(0.0, 0.0), (0.22, 0.0), (0.225, 0.012), (0.16, 0.03), (0.06, 0.06), (0.0, 0.065)], 0, 0, CH, n=40),
         tcyl(0, 0, 0.024, 0.024, 0.05, 0.58, CH),
         ring(0, 0, 0.19, 0.012, 0.29, CH, n=40)]
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        p.append(tube((0.02 * math.cos(a), 0.29, 0.02 * math.sin(a)), (0.19 * math.cos(a), 0.29, 0.19 * math.sin(a)), 0.011, 0.011, CH, n=8))
    p.append(cushion_disc(0, 0.02, 0.2, 0.62, 0.02, CH, rr=0.008))
    seat = rbox(0, 0.02, 0.4, 0.4, 0.64, 0.09, BK, r=0.04)
    p.append(seat)
    back = rbox(0, -0.2, 0.4, 0.08, 0.66, 0.27, BK, r=0.04)
    p.append(rot(back, "x", -30, (0, 0.66, -0.2)))
    for i in range(3):
        for j in range(3):
            p.append(rbox(-0.11 + j * 0.11, 0.02 + (i - 1) * 0.11, 0.008, 0.008, 0.728, 0.004, M(0.05, 0.05, 0.06, 0, 0.9, "fabric"), r=0.002))
    return p, [BK]


# ------------------------------------------------------------------ 6. red velvet 3-seater
def sofa():
    RED = M(0.82, 0.06, 0.12, 0, 0.95, "fabric")
    RED2 = M(0.72, 0.04, 0.1, 0, 0.95, "fabric")
    BK = M(0.07, 0.07, 0.08, 0.3, 0.5)
    w, d = 2.2, 0.77
    p = []
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.append(tube((sx * 0.93, 0.16, sz * 0.3), (sx * 0.98, 0, sz * 0.32), 0.017, 0.011, BK, n=10))
    p.append(rbox(0, 0, w, d, 0.16, 0.2, RED, r=0.03))
    p.append(rbox(0, -0.29, w, 0.19, 0.3, 0.55, RED, r=0.04))
    for sx in (-1, 1):
        p.append(rbox(sx * 1.02, 0.03, 0.16, d - 0.05, 0.3, 0.22, RED, r=0.05))
    p.append(rbox(0, 0.09, w - 0.38, 0.58, 0.34, 0.12, RED2, r=0.05))
    for i in range(11):
        p.append(rbox(-0.9 + i * 0.18, -0.2, 0.15, 0.03, 0.4, 0.42, RED2, r=0.014))
    return p, [RED, RED2]


# ------------------------------------------------------------------ 7. cream leather recliner armchair
def recliner():
    LE = M(0.86, 0.82, 0.74, 0, 0.5, "leather")
    LE2 = M(0.8, 0.76, 0.68, 0, 0.5, "leather")
    DK = M(0.14, 0.14, 0.15, 0, 0.6)
    p = [cushion_disc(0, 0, 0.3, 0, 0.05, DK, rr=0.015)]
    p.append(rbox(0, 0, 0.74, 0.66, 0.05, 0.3, LE2, r=0.09))
    for sx in (-1, 1):
        p.append(rbox(sx * 0.37, 0.0, 0.17, 0.82, 0.1, 0.44, LE, r=0.08))
        p.append(rbox(sx * 0.37, 0.05, 0.19, 0.6, 0.44, 0.08, LE, r=0.04))
        p.append(cyl(sx * 0.37, 0.24, 0.04, 0.515, 0.02, DK, n=20))
    p.append(rbox(0, 0.05, 0.58, 0.56, 0.3, 0.17, LE, r=0.08))
    back = rbox(0, -0.3, 0.62, 0.22, 0.32, 0.6, LE, r=0.1)
    p.append(rot(back, "x", -12, (0, 0.32, -0.3)))
    p.append(rot(rbox(0, -0.34, 0.5, 0.2, 0.86, 0.22, LE, r=0.09), "x", -12, (0, 0.32, -0.3)))
    p.append(rbox(0, 0.4, 0.6, 0.15, 0.12, 0.26, LE, r=0.07))
    p.append(tube((-0.45, 0.5, 0.15), (-0.5, 0.62, 0.0), 0.006, 0.006, DK, n=6))
    return p, [LE, LE2]


# ------------------------------------------------------------------ 8. LED wall unit (grey with wood-look drawers)
def wall_unit():
    G = M(0.72, 0.72, 0.71, 0, 0.75)
    WD = M(0.6, 0.6, 0.58, 0, 0.7, "veneer")
    WARM = M(0.97, 0.88, 0.66, 0, 0.95)
    GL = M(0.6, 0.68, 0.66, 0.1, 0.1, None, 0.4)
    w, d, h = 1.9, 0.38, 1.55
    p = []
    p.append(rbox(0, -0.17, w, 0.03, 0.05, h - 0.05, WARM, r=0.004))
    for sx in (-1, 1):
        p.append(rbox(sx * (w / 2 - 0.01), 0, 0.02, d, 0.0, h, G, r=0.004))
    p.append(rbox(0, 0, w, d, h - 0.02, 0.02, G, r=0.004))
    p.append(rbox(0, 0, w, d, 0, 0.05, G, r=0.004))
    xs = [-0.95, -0.5, -0.05, 0.4, 0.95]
    # vertical dividers
    for x in xs[1:-1]:
        p.append(rbox(x, 0, 0.016, d - 0.02, 0.05, h - 0.07, G, r=0.003))
    # horizontal shelves in columns A, B, D
    for z0 in (0.5, 0.85, 1.2):
        p.append(rbox((xs[0] + xs[1]) / 2, 0.0, xs[1] - xs[0], d - 0.02, z0, 0.016, G, r=0.003))
        p.append(rbox((xs[3] + xs[4]) / 2, 0.0, xs[4] - xs[3], d - 0.02, z0, 0.016, G, r=0.003))
    p.append(rbox((xs[0] + xs[1]) / 2, 0.02, 0.4, 0.3, 0.86, 0.008, GL, r=0.002))
    # glass doors (column B, upper) and solid door (column C, upper)
    p.append(rbox((xs[1] + xs[2]) / 2, 0.18, xs[2] - xs[1] - 0.01, 0.014, 0.5, 1.0, GL, r=0.004))
    p.append(rbox((xs[2] + xs[3]) / 2, 0.18, xs[3] - xs[2] - 0.01, 0.018, 0.5, 1.0, G, r=0.004))
    # lower band: four wood-look fronts + plinth LED glow
    fx = [xs[0], xs[1], xs[2], xs[3], xs[4]]
    for i in range(4):
        p.append(rbox((fx[i] + fx[i + 1]) / 2, 0.18, fx[i + 1] - fx[i] - 0.012, 0.02, 0.1, 0.4, WD, r=0.004))
    p.append(rbox(0, 0.16, w - 0.04, 0.02, 0.05, 0.03, WARM, r=0.004))
    return p, [G, WD]


# ------------------------------------------------------------------ 9. tall narrow cabinet, charcoal + beech doors
def tall_cabinet():
    CH = M(0.2, 0.2, 0.21, 0, 0.7)
    BE = M(0.86, 0.6, 0.32, 0, 0.6, "veneer")
    BK = M(0.05, 0.05, 0.06, 0.5, 0.4)
    w, d, h = 0.4, 0.4, 1.83
    p = [rbox(0, 0, w, d, 0, h, CH, r=0.006)]
    hh = (h - 0.06) / 2
    p.append(rbox(0, d / 2, w - 0.05, 0.02, 0.02, hh - 0.01, BE, r=0.004))
    p.append(rbox(0, d / 2, w - 0.05, 0.02, 0.02 + hh + 0.01, hh - 0.005, BE, r=0.004))
    p.append(beam((0.14, 1.0, d / 2 + 0.02), (0.14, 1.28, d / 2 + 0.02), 0.012, 0.012, BK))
    p.append(beam((0.14, 0.52, d / 2 + 0.02), (0.14, 0.8, d / 2 + 0.02), 0.012, 0.012, BK))
    return p, [BE]


# ------------------------------------------------------------------ 10. TV stand, grey oak, black legs
def tv_stand():
    WD = M(0.42, 0.39, 0.37, 0, 0.7, "veneer")
    WD2 = M(0.36, 0.33, 0.31, 0, 0.7, "veneer")
    BK = M(0.06, 0.06, 0.07, 0.5, 0.4)
    w, d = 1.4, 0.4
    p = [rbox(0, 0, w, d, 0.14, 0.34, WD, r=0.008)]
    p.append(rbox(0, 0, w + 0.02, d + 0.02, 0.47, 0.02, WD, r=0.006))
    fx = [-0.7, -0.24, 0.22, 0.7]
    for i in range(3):
        p.append(rbox((fx[i] + fx[i + 1]) / 2, d / 2, fx[i + 1] - fx[i] - 0.012, 0.018, 0.155, 0.31, WD2, r=0.004))
    for i in range(2):
        p.append(rbox((fx[i] + fx[i + 1]) / 2, d / 2 + 0.01, 0.2, 0.004, 0.42, 0.02, BK, r=0.002))
    p.append(cyl(0.6, d / 2 + 0.01, 0.014, 0.31, 0.01, M(0.75, 0.75, 0.78, 0.9, 0.3), n=14))
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.append(tube((sx * 0.62, 0.15, sz * 0.15), (sx * 0.66, 0, sz * 0.19), 0.017, 0.008, BK, n=8))
    return p, [WD, WD2]


# ------------------------------------------------------------------ 11/12. single beds
def bed(frame, mattress, headboard_h, foot_h, wide=0.98, long=2.05, studs=False):
    p = []
    hw, hl = wide / 2, long / 2
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.append(rbox(sx * (hw - 0.03), sz * (hl - 0.03), 0.06, 0.06, 0, 0.16, frame, r=0.01))
        p.append(rbox(sx * (hw - 0.015), 0, 0.03, long - 0.1, 0.16, 0.16, frame, r=0.006))
    p.append(rbox(0, 0, wide - 0.1, long - 0.1, 0.18, 0.03, frame, r=0.004))
    p.append(rbox(0, 0.02, wide - 0.1, long - 0.14, 0.21, 0.19, mattress, r=0.055))
    p.append(rbox(0, -hl + 0.03, wide, 0.06, 0.1, headboard_h, frame, r=0.012))
    p.append(rbox(0, hl - 0.02, wide, 0.04, 0.16, foot_h - 0.16, frame, r=0.01))
    for sx in (-1, 1):
        p.append(rbox(sx * (hw - 0.03), hl - 0.03, 0.06, 0.06, 0, foot_h + 0.03, frame, r=0.012))
        if studs:
            for sz in (-1, 1):
                p.append(cyl(sx * (hw - 0.03), sz * (hl - 0.03), 0.014, 0.0, 0.002, M(0.55, 0.55, 0.58, 0.9, 0.3), n=10))
    return p


def bed1():
    F = M(0.86, 0.83, 0.77, 0, 0.75, "veneer")
    MT = M(0.13, 0.13, 0.15, 0, 0.9, "fabric")
    return bed(F, MT, 0.86, 0.42), [F]


def bed2():
    F = M(0.3, 0.2, 0.16, 0, 0.7, "wood")
    MT = M(0.94, 0.94, 0.95, 0, 0.55, "fabric")
    ps = bed(F, MT, 0.84, 0.36, studs=True)
    ps.append(rbox(0, -1.0 + 0.03, 1.0, 0.09, 0.9, 0.03, F, r=0.012))
    return ps, [F]


# ------------------------------------------------------------------ 13. ergonomic mesh office chair
def bez(p0, p1, p2, n=6):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in [i / n for i in range(n + 1)]]


def office_chair():
    BK = M(0.08, 0.08, 0.09, 0, 0.5)
    MESH = M(0.31, 0.31, 0.33, 0, 0.9, "mesh")
    PAD = M(0.05, 0.05, 0.06, 0, 0.95, "fabric")
    FAB = M(0.07, 0.07, 0.08, 0, 0.95, "fabric")
    CH = M(0.6, 0.6, 0.62, 0.9, 0.3)
    p = []
    # --- five-star nylon base with twin-wheel casters
    for i in range(5):
        a = i * 2 * math.pi / 5 + 0.3
        ex, ez = math.cos(a) * 0.33, math.sin(a) * 0.33
        p.append(tube((0, 0.13, 0), (ex * 0.55, 0.095, ez * 0.55), 0.034, 0.026, BK, n=8))
        p.append(tube((ex * 0.55, 0.095, ez * 0.55), (ex, 0.07, ez), 0.024, 0.017, BK, n=8))
        p.append(tube((ex, 0.075, ez), (ex, 0.045, ez), 0.011, 0.011, BK, n=8))
        for k in (-1, 1):
            w = rot(rot(cyl(0, 0, 0.03, -0.009, 0.018, BK, n=12), "x", 90), "y", -math.degrees(a))
            tx, tz = -math.sin(a) * 0.014 * k, math.cos(a) * 0.014 * k
            p.append(mv(w, ex + tx, 0.026, ez + tz))
    p.append(tcyl(0, 0, 0.045, 0.03, 0.09, 0.06, BK))
    p.append(tcyl(0, 0, 0.032, 0.032, 0.13, 0.3, BK))
    p.append(tcyl(0, 0, 0.05, 0.045, 0.14, 0.2, BK))
    # --- mechanism + seat
    p.append(rbox(0, -0.03, 0.36, 0.4, 0.42, 0.045, BK, r=0.02))
    p.append(tube((0.2, 0.44, 0.08), (0.3, 0.42, 0.18), 0.006, 0.006, BK, n=6))
    p.append(rbox(0.13, -0.08, 0.06, 0.1, 0.36, 0.07, BK, r=0.02))
    p.append(rbox(0, 0.035, 0.54, 0.54, 0.455, 0.105, FAB, r=0.055))
    # --- curved mesh back, built from slices along an S-curve
    n = 22
    y0, z0, h = 0.53, -0.24, 0.46
    pts = []
    y, z = y0, z0
    ds = h / n
    for k in range(n + 1):
        t = k / n
        ang = 4 + 12 * t
        pts.append((y, z, ang, 0.42 + 0.09 * (t * t * (3 - 2 * t))))
        y += math.cos(math.radians(ang)) * ds
        z -= math.sin(math.radians(ang)) * ds
    for k in range(n):
        yc = (pts[k][0] + pts[k + 1][0]) / 2
        zc = (pts[k][1] + pts[k + 1][1]) / 2
        ang = (pts[k][2] + pts[k + 1][2]) / 2
        w = (pts[k][3] + pts[k + 1][3]) / 2
        sl = rot(rbox(0, 0, w, 0.012, -ds / 2, ds * 1.6, MESH, r=0.0015, seg=1), "x", -ang)
        p.append(mv(sl, 0, yc, zc))
        if 3 <= k <= 9:
            lp = rot(rbox(0, 0, w * 0.8, 0.012, -ds / 2, ds * 1.6, PAD, r=0.0015, seg=1), "x", -ang)
            p.append(mv(lp, 0, yc, zc + 0.007))
        if k <= 10:
            rc = rot(rbox(0, 0, w + 0.03, 0.03, -ds / 2, ds * 1.6, BK, r=0.008, seg=1), "x", -ang)
            p.append(mv(rc, 0, yc, zc - 0.025))
    for sx in (-1, 1):
        for k in range(n):
            a_, b_ = pts[k], pts[k + 1]
            p.append(tube((sx * a_[3] / 2, a_[0], a_[1]), (sx * b_[3] / 2, b_[0], b_[1]), 0.014, 0.014, BK, n=8))
    for k, kk in ((0, 0), (n, n)):
        e = pts[k]
        p.append(tube((-e[3] / 2, e[0], e[1]), (e[3] / 2, e[0], e[1]), 0.014, 0.014, BK, n=8))
    # spine linking back to the mechanism
    p.append(tube((0, 0.45, -0.1), (0, pts[1][0], pts[1][1] - 0.01), 0.026, 0.02, BK, n=8))
    # --- headrest on a hooked arm
    top = pts[n]
    hy, hz = top[0] + 0.03, top[1] - 0.02
    for sx in (-1, 1):
        p.append(tube((sx * 0.06, top[0] - 0.05, top[1] - 0.012), (sx * 0.06, hy, hz - 0.03), 0.012, 0.012, BK, n=8))
    head = rbox(0, 0, 0.34, 0.07, -0.085, 0.17, PAD, r=0.035)
    p.append(mv(rot(head, "x", -14), 0, hy + 0.05, hz - 0.03))
    # --- C-shaped loop arms
    for sx in (-1, 1):
        x = sx * 0.285
        loop = [(-0.21, 0.6)]
        loop += bez((-0.21, 0.6), (-0.21, 0.69), (-0.06, 0.69), 8)[1:]
        loop += [(0.1, 0.685)]
        loop += bez((0.1, 0.685), (0.2, 0.685), (0.185, 0.58), 8)[1:]
        loop += bez((0.185, 0.58), (0.18, 0.495), (0.08, 0.495), 8)[1:]
        loop += bez((0.08, 0.495), (-0.1, 0.485), (-0.21, 0.52), 8)[1:]
        loop += [(-0.21, 0.6)]
        for (za, ya), (zb, yb) in zip(loop, loop[1:]):
            p.append(tube((x, ya, za), (x, yb, zb), 0.019, 0.019, BK, n=10))
    return p, [FAB, MESH, PAD]


# ------------------------------------------------------------------ 14. L-shaped executive desk, cream oak + black trim
def exec_desk():
    C = M(0.87, 0.83, 0.75, 0, 0.7, "veneer")
    C2 = M(0.8, 0.75, 0.66, 0, 0.7, "veneer")
    BK = M(0.07, 0.07, 0.08, 0.2, 0.5)
    p = []
    L = [(-1.0, -0.5), (1.0, -0.5), (1.0, 0.1), (0.5, 0.1), (0.5, 0.5), (-0.1, 0.5), (-0.1, 0.1), (-1.0, 0.1)]
    p.append(polyprism(L, 0.72, 0.035, C))
    e = 0.006
    p.append(polyprism([(-1.0 - e, -0.5 - e), (1.0 + e, -0.5 - e), (1.0 + e, 0.1 + e), (0.5 + e, 0.1 + e), (0.5 + e, 0.5 + e), (-0.1 - e, 0.5 + e), (-0.1 - e, 0.1 + e), (-1.0 - e, 0.1 + e)], 0.7, 0.02, BK))
    for sx in (-1, 1):
        x = sx * 0.76
        p.append(rbox(x, -0.2, 0.44, 0.55, 0.06, 0.66, C2, r=0.006))
        for k in range(3):
            p.append(rbox(x, 0.085, 0.4, 0.02, 0.12 + k * 0.19, 0.16, C, r=0.005))
            p.append(rbox(x, 0.097, 0.16, 0.008, 0.19 + k * 0.19, 0.014, BK, r=0.003))
        p.append(rbox(x, -0.2, 0.47, 0.57, 0.0, 0.06, BK, r=0.004))
    p.append(rbox(0.2, 0.3, 0.6, 0.36, 0.06, 0.66, C2, r=0.006))
    p.append(rbox(0.2, 0.485, 0.56, 0.02, 0.09, 0.6, C, r=0.005))
    p.append(rbox(0.2, 0.497, 0.36, 0.008, 0.62, 0.014, BK, r=0.003))
    p.append(rbox(0.2, 0.3, 0.63, 0.39, 0.0, 0.06, BK, r=0.004))
    p.append(rbox(-0.12, -0.44, 1.0, 0.02, 0.15, 0.55, C2, r=0.005))
    return p, [C, C2]


# ------------------------------------------------------------------ 15. two-door office cabinet, light oak
def office_cabinet():
    C = M(0.88, 0.85, 0.78, 0, 0.7, "veneer")
    TOP = M(0.55, 0.5, 0.45, 0, 0.7, "veneer")
    BK = M(0.14, 0.14, 0.15, 0.7, 0.35)
    w, d, h = 0.8, 0.42, 1.5
    p = [rbox(0, 0, w, d, 0.04, h - 0.06, C, r=0.006), rbox(0, 0, w + 0.02, d + 0.015, h - 0.025, 0.025, TOP, r=0.005), rbox(0, 0, w - 0.03, d - 0.03, 0, 0.05, TOP, r=0.004)]
    for sx in (-1, 1):
        p.append(rbox(sx * 0.196, d / 2, 0.385, 0.02, 0.06, h - 0.1, C, r=0.005))
        p.append(beam((sx * 0.06, 0.6, d / 2 + 0.03), (sx * 0.06, 0.95, d / 2 + 0.03), 0.014, 0.014, BK))
    return p, [C]


CATALOG = [
    # slug, model fn, name, description, cat-independent info
    ("oshxona-stoli-milano", dining_table, "To'qilgan oshxona stoli", "Ratan ko'rinishidagi to'qilgan asos va shisha usti bilan oshxona/hovli stoli. Qora-kulrang rang, kengligi 133 sm.", 133, 93, 72, "Sun'iy ratan + shisha", "To'q kulrang"),
    ("yumaloq-stol-luna", round_table, "Yumaloq shisha stol", "Shaffof shisha ustli, qora metall-ratan ramkali yumaloq stol. Diametri 100 sm, hovli va mehmonxona uchun.", 100, 100, 72, "Shisha + metall", "Qora / shaffof"),
    ("yozuv-stoli-nordic", writing_desk, "Yozuv stoli (Z-oyoqli)", "Yong'oq rangli usti va qora Z-shaklidagi metall oyoqlari bor yozuv stoli. Ichida tortma bor, uy va ofis uchun.", 120, 60, 75, "LDSP + metall", "Yong'oq / qora"),
    ("stul-klassik", plastic_chair, "Plastik stul", "Yengil, bir-birining ustiga qo'yiladigan plastik stul, suyanchig'ida teshikchalar bor. Oshxona va kafe uchun.", 46, 52, 83, "Plastik", "Bej"),
    ("bar-stuli-loft", bar_stool, "Bar stuli (qora)", "Qora tikilgan mato o'rindiqli, xrom oyoqli, balandligi sozlanadigan bar stuli.", 45, 50, 100, "Mato + xrom metall", "Qora / xrom"),
    ("divan-comfort", sofa, "Qizil baxmal divan", "Uch kishilik qizil baxmal divan: vertikal tikilgan suyanchiq va ingichka qora oyoqlar.", 220, 77, 85, "Baxmal + metall", "Qizil"),
    ("kreslo-relax", recliner, "Rekliner kreslo (massajli)", "Krem rangli charm rekliner kreslo: oyoq tayanchi, stakan tutqichlari va yon cho'ntagi bor.", 90, 95, 105, "Sun'iy charm", "Krem"),
    ("kiyim-shkafi-grand", wall_unit, "Devor shkafi (LED yoritgichli)", "Kulrang devor shkafi: yoritilgan ochiq javonlar, shisha eshiklar va pastda tortmalar.", 190, 38, 155, "LDSP + shisha", "Kulrang"),
    ("kitob-javoni-library", tall_cabinet, "Tor shkaf (ikki eshikli)", "Ingichka, baland ikki eshikli shkaf: qora-kulrang korpus, tabiiy yog'och rangli eshiklar.", 40, 40, 183, "LDSP", "Kulrang / eman"),
    ("tv-tumba-modern", tv_stand, "TV tumba", "Kulrang yog'och naqshli TV tumba, uchta eshikli va qora metall oyoqlarda.", 140, 40, 48, "LDSP + metall", "Kulrang"),
    ("krevat-royal", bed1, "Bir kishilik krevat (och rang)", "Och eskirgan eman rangidagi bir kishilik krevat, baland bosh qismi bilan. Matras 90x200 sm.", 98, 205, 86, "LDSP", "Och eman"),
    ("bolalar-krevati-sweet", bed2, "Bir kishilik krevat (yong'oq)", "To'q yong'oq rangli mustahkam bir kishilik krevat, metall parchinlar bilan. Matras 90x200 sm.", 98, 205, 84, "LDSP", "Yong'oq"),
    ("ofis-kreslosi-ergo", office_chair, "Ofis kreslosi Ergo", "To'r suyanchiqli, bosh tayanchli ergonomik kreslo. Qo'llari mustahkam, g'ildirakli.", 60, 62, 117, "To'r mato + plastik", "Qora"),
    ("kompyuter-stoli-pro", exec_desk, "Rahbar stoli (L-shaklli)", "Krem eman rangidagi L-shaklli rahbar stoli: ikki tomonda tortmali tumbalar va old qismida tumba.", 200, 100, 75, "LDSP", "Krem eman"),
    ("ofis-shkafi", office_cabinet, "Ofis shkafi (ikki eshikli)", "Och eman rangli ikki eshikli shkaf, qora dastalar. Hujjatlar va buyumlar uchun.", 80, 42, 150, "LDSP", "Och eman"),
]


def main():
    cat = json.load(open(os.path.join(ROOT, "prisma", "catalog.json")))
    by = {c["slug"]: c for c in cat}
    for slug, fn, name, desc, w, d, h, material, color in CATALOG:
        parts, recolor = fn()
        write_glb(os.path.join(MODELS, slug + ".glb"), parts)
        write_usdz(os.path.join(MODELS, slug + ".usdz"), parts)
        order = list(all_tris(parts).keys())
        idx = [i for i, k in enumerate(order) if k in recolor]
        from engine import bounds
        bx = bounds(parts)
        print('  size cm', round((bx[1] - bx[0]) * 100), round((bx[5] - bx[4]) * 100), round((bx[3] - bx[2]) * 100))
        e = by[slug]
        w, d, h = round((bx[1] - bx[0]) * 100), round((bx[5] - bx[4]) * 100), round((bx[3] - bx[2]) * 100)
        e.update(name=name, description=desc, width=w, depth=d, height=h, material=material, color=color, colorParts=idx)
        print(slug, len(order), "materials, recolor", idx)
    json.dump(cat, open(os.path.join(ROOT, "prisma", "catalog.json"), "w"), ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
