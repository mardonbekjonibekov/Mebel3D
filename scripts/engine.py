"""Tiny mesh engine: primitives (prisms, rounded boxes, tapered cylinders, lathe) and .glb / .usdz writers.

A colour/material is a tuple (r, g, b, metallic, roughness[, texture_name]).
A part is either a prism dict (pts, y0, y1, c, smooth) or {"tris": [...], "c": colour}.
"""
import io, json, math, random, struct, zlib

UV_SCALE = 1.4  # texture repeats per metre


def normalize(v):
    l = math.sqrt(sum(a * a for a in v)) or 1
    return tuple(a / l for a in v)


# ------------------------------------------------------------------ textures
def make_texture(name):
    from PIL import Image

    S = 256
    img = Image.new("RGB", (S, S))
    px = img.load()
    rnd = random.Random(11)
    ph = [rnd.random() * 6.283 for _ in range(6)]
    if name == "wood":
        for y in range(S):
            for x in range(S):
                u, v = x / S, y / S
                w = 0.6 * math.sin(2 * math.pi * (2 * u) + ph[0]) + 0.4 * math.sin(2 * math.pi * (3 * u + v) + ph[1])
                g = math.sin(2 * math.pi * (9 * v + 0.12 * w) + ph[2])
                fine = 0.5 * math.sin(2 * math.pi * (41 * v + 0.6 * w) + ph[3]) + 0.3 * math.sin(2 * math.pi * (97 * v) + ph[4])
                val = 0.88 + 0.06 * g + 0.03 * fine + 0.02 * rnd.random()
                c = int(max(0, min(1, val)) * 255)
                px[x, y] = (c, c, c)
    elif name == "fabric":
        for y in range(S):
            for x in range(S):
                t = ((x // 2) + (y // 2)) % 2
                val = 0.9 + 0.035 * t + 0.015 * math.sin(2 * math.pi * x * 16 / S) + 0.02 * rnd.random()
                c = int(max(0, min(1, val)) * 255)
                px[x, y] = (c, c, c)
    elif name == "leather":
        small = Image.new("L", (128, 128))
        sp = small.load()
        for y in range(128):
            for x in range(128):
                sp[x, y] = int(226 + rnd.random() * 26)
        big = small.resize((S, S), Image.BICUBIC).convert("RGB")
        img = big
    elif name == "veneer":
        base = [0.0] * S
        v = 0.9
        for x in range(S):
            v = 0.7 * v + 0.3 * (0.86 + rnd.random() * 0.1)
            base[x] = v
        for y in range(S):
            for x in range(S):
                val = base[x] * (0.985 + 0.015 * math.sin(2 * math.pi * (y * 2 / S) + x * 0.35)) + 0.012 * rnd.random()
                c = int(max(0, min(1, val)) * 255)
                px[x, y] = (c, c, c)
    elif name == "mesh":
        for y in range(S):
            for x in range(S):
                t = ((x % 4) < 2) ^ ((y % 4) < 2)
                c = int((0.72 + 0.22 * t) * 255)
                px[x, y] = (c, c, c)
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


_tex_cache = {}


def texture_bytes(name):
    if name not in _tex_cache:
        _tex_cache[name] = make_texture(name)
    return _tex_cache[name]


def lin(v):
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def tex_of(colour):
    return colour[5] if len(colour) > 5 else None


# ------------------------------------------------------------------ triangles
def uv_for(p, n):
    ax, ay, az = abs(n[0]), abs(n[1]), abs(n[2])
    if ay >= ax and ay >= az:
        return (p[0] * UV_SCALE, p[2] * UV_SCALE)
    if ax >= az:
        return (p[2] * UV_SCALE, p[1] * UV_SCALE)
    return (p[0] * UV_SCALE, p[1] * UV_SCALE)


def _emit(out, a, b, c, na, nb, nc, uva=None, uvb=None, uvc=None):
    n = normalize(tuple(sum(x) for x in zip(na, nb, nc)))
    e1 = tuple(b[i] - a[i] for i in range(3))
    e2 = tuple(c[i] - a[i] for i in range(3))
    cr = (e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0])
    if sum(cr[i] * n[i] for i in range(3)) < 0:
        b, c, nb, nc = c, b, nc, nb
        uvb, uvc = uvc, uvb
    uva = uva or uv_for(a, na)
    uvb = uvb or uv_for(b, nb)
    uvc = uvc or uv_for(c, nc)
    out.append((a, b, c, na, nb, nc, uva, uvb, uvc))


def prism_tris(pr):
    pts, y0, y1 = pr["pts"], pr["y0"], pr["y1"]
    cx = sum(p[0] for p in pts) / len(pts)
    cz = sum(p[1] for p in pts) / len(pts)
    out = []
    for k in range(1, len(pts) - 1):
        _emit(out, (pts[0][0], y1, pts[0][1]), (pts[k][0], y1, pts[k][1]), (pts[k + 1][0], y1, pts[k + 1][1]), (0, 1, 0), (0, 1, 0), (0, 1, 0))
        _emit(out, (pts[0][0], y0, pts[0][1]), (pts[k][0], y0, pts[k][1]), (pts[k + 1][0], y0, pts[k + 1][1]), (0, -1, 0), (0, -1, 0), (0, -1, 0))
    for i in range(len(pts)):
        a, b = pts[i], pts[(i + 1) % len(pts)]
        mx, mz = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        if not pr["smooth"]:
            ex, ez = b[0] - a[0], b[1] - a[1]
            n = normalize((ez, 0, -ex))
            if n[0] * (mx - cx) + n[2] * (mz - cz) < 0:
                n = (-n[0], 0, -n[2])
            na = nb = n
        else:
            na = normalize((a[0] - cx, 0, a[1] - cz))
            nb = normalize((b[0] - cx, 0, b[1] - cz))
        A0, B0, B1, A1 = (a[0], y0, a[1]), (b[0], y0, b[1]), (b[0], y1, b[1]), (a[0], y1, a[1])
        _emit(out, A0, B0, B1, na, nb, nb)
        _emit(out, A0, B1, A1, na, nb, na)
    return out


def all_tris(parts):
    groups = {}
    for pr in parts:
        tris = pr["tris"] if "tris" in pr else prism_tris(pr)
        groups.setdefault(pr["c"], []).extend(tris)
    return groups


def bounds(parts):
    pts = [v for tris in all_tris(parts).values() for t in tris for v in t[:3]]
    xs, ys, zs = [p[0] for p in pts], [p[1] for p in pts], [p[2] for p in pts]
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)


# ------------------------------------------------------------------ primitives
def box(x, z, w, d, y0, h, c):
    return dict(pts=[(x - w / 2, z - d / 2), (x + w / 2, z - d / 2), (x + w / 2, z + d / 2), (x - w / 2, z + d / 2)], y0=y0, y1=y0 + h, c=c, smooth=False)


def cyl(x, z, r, y0, h, c, n=24):
    pts = [(x + r * math.cos(2 * math.pi * i / n), z + r * math.sin(2 * math.pi * i / n)) for i in range(n)]
    return dict(pts=pts, y0=y0, y1=y0 + h, c=c, smooth=True)


def bar(x0, z0, x1, z1, w, y0, h, c):
    """Oriented rectangular bar between two points on the floor plane."""
    dx, dz = x1 - x0, z1 - z0
    l = math.hypot(dx, dz) or 1
    nx, nz = -dz / l * w / 2, dx / l * w / 2
    return dict(pts=[(x0 + nx, z0 + nz), (x1 + nx, z1 + nz), (x1 - nx, z1 - nz), (x0 - nx, z0 - nz)], y0=y0, y1=y0 + h, c=c, smooth=False)


def rbox(x, z, w, d, y0, h, c, r=0.02, seg=3):
    """Box with rounded (bevelled, smooth-shaded) edges."""
    hx, hy, hz = w / 2, h / 2, d / 2
    r = max(0.0005, min(r, hx, hy, hz) * 0.98)
    half = (hx, hy, hz)
    cen = (x, y0 + hy, z)

    def samples(hh):
        arc = [r * math.tan(math.radians(a)) for a in [45 - 45 * (i + 1) / (seg + 1) for i in range(seg)]]
        # angles descending inside (45deg edge .. 0deg = start of the flat), positions relative to (hh - r)
        pos_edge = [hh] + [(hh - r) + t for t in arc]
        pos_edge = sorted(set(round(v, 6) for v in pos_edge + [hh - r]), reverse=True)
        out = sorted(set([-v for v in pos_edge] + pos_edge))
        return out

    ss = [samples(h_) for h_ in half]
    out = []
    for a in range(3):
        u, v = [i for i in range(3) if i != a]
        for s in (-1, 1):
            for i in range(len(ss[u]) - 1):
                for j in range(len(ss[v]) - 1):
                    quad = []
                    for (ii, jj) in ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)):
                        P = [0.0, 0.0, 0.0]
                        P[a] = s * half[a]
                        P[u] = ss[u][ii]
                        P[v] = ss[v][jj]
                        inner = [max(-half[k] + r, min(half[k] - r, P[k])) for k in range(3)]
                        nrm = normalize(tuple(P[k] - inner[k] for k in range(3)))
                        pos = tuple(cen[k] + inner[k] + nrm[k] * r for k in range(3))
                        quad.append((pos, nrm))
                    (p0, n0), (p1, n1), (p2, n2), (p3, n3) = quad
                    _emit(out, p0, p1, p2, n0, n1, n2)
                    _emit(out, p0, p2, p3, n0, n2, n3)
    return dict(tris=out, c=c)


def lathe(profile, x, z, c, n=32, closed=False, y_off=0.0):
    """Revolve a (radius, y) profile around the vertical axis at (x, z). Smooth shading."""
    m = len(profile)
    segs = range(m if closed else m - 1)

    def seg_normal(i):
        (r1, y1), (r2, y2) = profile[i], profile[(i + 1) % m]
        return normalize((y2 - y1, -(r2 - r1)))

    vn = []
    for i in range(m):
        if closed:
            a, b = seg_normal((i - 1) % m), seg_normal(i)
        else:
            a = seg_normal(max(i - 1, 0)) if i > 0 else seg_normal(0)
            b = seg_normal(min(i, m - 2))
        vn.append(normalize((a[0] + b[0], a[1] + b[1])))
    out = []
    for k in range(n):
        f0, f1 = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
        for i in segs:
            j = (i + 1) % m
            def P(idx, f):
                r, y = profile[idx]
                return (x + r * math.cos(f), y + y_off, z + r * math.sin(f))
            def N(idx, f):
                nr, ny = vn[idx]
                return (nr * math.cos(f), ny, nr * math.sin(f))
            a, b, c2, d = P(i, f0), P(i, f1), P(j, f1), P(j, f0)
            na, nb, nc, nd = N(i, f0), N(i, f1), N(j, f1), N(j, f0)
            _emit(out, a, b, c2, na, nb, nc)
            _emit(out, a, c2, d, na, nc, nd)
    return dict(tris=out, c=c)


def tcyl(x, z, r0, r1, y0, h, c, n=18):
    """Tapered cylinder: radius r0 at the bottom, r1 at the top, with caps."""
    prof = [(0.0, y0), (r0, y0), (r1, y0 + h), (0.0, y0 + h)]
    part = lathe(prof, x, z, c, n=n)
    # flatten the cap normals so the ends don't look blobby
    fixed = []
    for t in part["tris"]:
        a, b, cc, na, nb, nc, ua, ub, uc = t
        if all(abs(p[1] - y0) < 1e-9 for p in (a, b, cc)):
            na = nb = nc = (0, -1, 0)
        elif all(abs(p[1] - (y0 + h)) < 1e-9 for p in (a, b, cc)):
            na = nb = nc = (0, 1, 0)
        fixed.append((a, b, cc, na, nb, nc, ua, ub, uc))
    part["tris"] = fixed
    return part


def cushion_disc(x, z, r, y0, h, c, rr=0.02, n=40):
    """Round seat: cylinder with a rounded top edge."""
    rr = min(rr, h / 2, r * 0.5)
    prof = [(0.0, y0), (r - rr * 0.3, y0), (r, y0 + rr * 0.6), (r, y0 + h - rr), (r - rr * 0.35, y0 + h - rr * 0.2), (r - rr, y0 + h), (0.0, y0 + h)]
    return lathe(prof, x, z, c, n=n)


# ------------------------------------------------------------------ writers
def write_glb(path, parts):
    x0, x1, y0, _, z0, z1 = bounds(parts)
    ox, oy, oz = (x0 + x1) / 2, y0, (z0 + z1) / 2
    groups = all_tris(parts)
    blob = bytearray()
    views, accessors, prims, mats = [], [], [], []
    images, tex_index = [], {}

    def add_view(data, target=None):
        pad = -len(blob) % 4
        blob.extend(b"\0" * pad)
        view = dict(buffer=0, byteOffset=len(blob), byteLength=len(data))
        if target:
            view["target"] = target
        views.append(view)
        blob.extend(data)
        return len(views) - 1

    for ci, (col, tris) in enumerate(groups.items()):
        pos, nor, uvs = [], [], []
        for t in tris:
            for k in range(3):
                v = t[k]
                pos.append((v[0] - ox, v[1] - oy, v[2] - oz))
                nor.append(t[3 + k])
                uvs.append(t[6 + k])
        pb = b"".join(struct.pack("<3f", *p) for p in pos)
        nb = b"".join(struct.pack("<3f", *n) for n in nor)
        ub = b"".join(struct.pack("<2f", *u) for u in uvs)
        ib = b"".join(struct.pack("<I", i) for i in range(len(pos)))
        mn = [min(p[i] for p in pos) for i in range(3)]
        mx = [max(p[i] for p in pos) for i in range(3)]
        a0 = len(accessors)
        accessors.append(dict(bufferView=add_view(pb, 34962), componentType=5126, count=len(pos), type="VEC3", min=mn, max=mx))
        accessors.append(dict(bufferView=add_view(nb, 34962), componentType=5126, count=len(pos), type="VEC3"))
        accessors.append(dict(bufferView=add_view(ub, 34962), componentType=5126, count=len(pos), type="VEC2"))
        accessors.append(dict(bufferView=add_view(ib, 34963), componentType=5125, count=len(pos), type="SCALAR"))
        prims.append(dict(attributes=dict(POSITION=a0, NORMAL=a0 + 1, TEXCOORD_0=a0 + 2), indices=a0 + 3, material=ci))
        alpha = col[6] if len(col) > 6 else 1
        pbr = dict(baseColorFactor=[lin(col[0]), lin(col[1]), lin(col[2]), alpha], metallicFactor=col[3], roughnessFactor=col[4])
        tname = tex_of(col)
        if tname:
            if tname not in tex_index:
                images.append(dict(bufferView=add_view(texture_bytes(tname)), mimeType="image/png"))
                tex_index[tname] = len(images) - 1
            pbr["baseColorTexture"] = dict(index=tex_index[tname])
        mat = dict(name=f"m{ci}", pbrMetallicRoughness=pbr)
        if alpha < 1:
            mat.update(alphaMode="BLEND", doubleSided=True)
        mats.append(mat)
    doc = dict(asset=dict(version="2.0", generator="mebel3d-generator"), scene=0, scenes=[dict(nodes=[0])], nodes=[dict(mesh=0, name="furniture")],
               meshes=[dict(primitives=prims)], materials=mats, accessors=accessors, bufferViews=views, buffers=[dict(byteLength=0)])
    if images:
        doc["images"] = images
        doc["samplers"] = [dict(magFilter=9729, minFilter=9987, wrapS=10497, wrapT=10497)]
        doc["textures"] = [dict(sampler=0, source=i) for i in range(len(images))]
    blob.extend(b"\0" * (-len(blob) % 4))
    doc["buffers"][0]["byteLength"] = len(blob)
    js = json.dumps(doc, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    total = 12 + 8 + len(js) + 8 + len(blob)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(blob), 0x004E4942) + bytes(blob))


def usda_text(parts):
    x0, x1, y0, _, z0, z1 = bounds(parts)
    ox, oy, oz = (x0 + x1) / 2, y0, (z0 + z1) / 2
    groups = all_tris(parts)
    L = ['#usda 1.0', '(', '    defaultPrim = "Root"', '    metersPerUnit = 1', '    upAxis = "Y"', ')', '', 'def Xform "Root"', '{']
    used = []
    for ci, (col, tris) in enumerate(groups.items()):
        pts, nrm, uvs = [], [], []
        for t in tris:
            for k in range(3):
                v = t[k]
                pts.append("(%.4f, %.4f, %.4f)" % (v[0] - ox, v[1] - oy, v[2] - oz))
                nrm.append("(%.4f, %.4f, %.4f)" % t[3 + k])
                uvs.append("(%.4f, %.4f)" % (t[6 + k][0], t[6 + k][1]))
        n = len(pts)
        L += [f'    def Mesh "part{ci}" (', '        prepend apiSchemas = ["MaterialBindingAPI"]', '    )', '    {',
              f'        int[] faceVertexCounts = [{",".join(["3"] * (n // 3))}]',
              f'        int[] faceVertexIndices = [{",".join(str(i) for i in range(n))}]',
              f'        point3f[] points = [{", ".join(pts)}]',
              f'        normal3f[] normals = [{", ".join(nrm)}] (', '            interpolation = "faceVarying"', '        )',
              f'        texCoord2f[] primvars:st = [{", ".join(uvs)}] (', '            interpolation = "faceVarying"', '        )',
              '        uniform token subdivisionScheme = "none"',
              f'        rel material:binding = </Root/Materials/M{ci}>', '    }']
    L += ['    def Scope "Materials"', '    {']
    for ci, col in enumerate(groups.keys()):
        tname = tex_of(col)
        L += [f'        def Material "M{ci}"', '        {',
              f'            token outputs:surface.connect = </Root/Materials/M{ci}/Surf.outputs:surface>']
        if tname:
            used.append(tname)
            L += ['            def Shader "ST"', '            {', '                uniform token info:id = "UsdPrimvarReader_float2"',
                  '                string inputs:varname = "st"', '                float2 outputs:result', '            }',
                  '            def Shader "Tex"', '            {', '                uniform token info:id = "UsdUVTexture"',
                  f'                asset inputs:file = @textures/{tname}.png@',
                  f'                float2 inputs:st.connect = </Root/Materials/M{ci}/ST.outputs:result>',
                  '                token inputs:wrapS = "repeat"', '                token inputs:wrapT = "repeat"',
                  f'                float4 inputs:scale = ({lin(col[0]):.4f}, {lin(col[1]):.4f}, {lin(col[2]):.4f}, 1)',
                  '                float3 outputs:rgb', '            }']
        L += ['            def Shader "Surf"', '            {', '                uniform token info:id = "UsdPreviewSurface"']
        if tname:
            L += [f'                color3f inputs:diffuseColor.connect = </Root/Materials/M{ci}/Tex.outputs:rgb>']
        else:
            L += [f'                color3f inputs:diffuseColor = ({lin(col[0]):.4f}, {lin(col[1]):.4f}, {lin(col[2]):.4f})']
        L += [f'                float inputs:metallic = {col[3]}', f'                float inputs:roughness = {col[4]}'] + ([f'                float inputs:opacity = {col[6]}'] if len(col) > 6 and col[6] < 1 else []) + [
              '                token outputs:surface', '            }', '        }']
    L += ['    }', '}', '']
    return "\n".join(L).encode(), sorted(set(used))


def write_usdz(path, parts):
    usda, used = usda_text(parts)
    files = [("model.usda", usda)] + [(f"textures/{t}.png", texture_bytes(t)) for t in used]
    body = bytearray()
    central = bytearray()
    for name, data in files:
        nb = name.encode()
        crc = zlib.crc32(data) & 0xFFFFFFFF
        offset = len(body)
        base = offset + 30 + len(nb)
        pad = (-base) % 64
        if 0 < pad < 4:
            pad += 64
        extra = struct.pack("<HH", 0x9999, pad - 4) + b"\0" * (pad - 4) if pad else b""
        body += struct.pack("<IHHHHHIIIHH", 0x04034B50, 20, 0, 0, 0, 0x21, crc, len(data), len(data), len(nb), len(extra)) + nb + extra + data
        central += struct.pack("<IHHHHHHIIIHHHHHII", 0x02014B50, 20, 20, 0, 0, 0, 0x21, crc, len(data), len(data), len(nb), 0, 0, 0, 0, 0, offset) + nb
    eocd = struct.pack("<IHHHHIIH", 0x06054B50, 0, 0, len(files), len(files), len(central), len(body), 0)
    with open(path, "wb") as f:
        f.write(bytes(body) + bytes(central) + eocd)
