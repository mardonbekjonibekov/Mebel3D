export function hexToLinear(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return [lin(c[0]), lin(c[1]), lin(c[2]), 1];
}

export function captureOriginals(el) {
  return (el.model?.materials || []).map((m) => ({
    factor: [...m.pbrMetallicRoughness.baseColorFactor],
    metallic: m.pbrMetallicRoughness.metallicFactor,
    texture: m.pbrMetallicRoughness.baseColorTexture?.texture ?? null,
  }));
}

function o0(originals, i) {
  return originals[i]?.texture ?? null;
}

export function applyRecolor(el, originals, hex, parts) {
  if (!el?.model || !originals) return;
  el.model.materials.forEach((m, i) => {
    const pbr = m.pbrMetallicRoughness;
    const recolor = !parts || parts.includes(i);
    if (!hex || !recolor) {
      const o = originals[i];
      if (!o) return;
      pbr.setBaseColorFactor(o.factor);
      pbr.setMetallicFactor(o.metallic);
      pbr.baseColorTexture?.setTexture(o.texture);
    } else {
      pbr.setBaseColorFactor(hexToLinear(hex));
      pbr.setMetallicFactor(0);
      // Tekstura qoladi: skaner modelida hamma detal shu teksturada, uni olib tashlasak model yassi dog' bo'lib qoladi
      pbr.baseColorTexture?.setTexture(o0(originals, i));
    }
  });
}

export function parseJson(str, fallback) {
  try {
    const v = JSON.parse(str);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
