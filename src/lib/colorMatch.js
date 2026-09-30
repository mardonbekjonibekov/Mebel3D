// Zero-cost "AI stylist": extracts dominant colors from an uploaded room photo
// entirely in the browser (canvas pixel sampling) and matches them against
// product color variants already stored in the DB. No external API calls.

export function extractDominantColors(img, count = 5) {
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const step = 32; // quantize channels to reduce the color space into buckets
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // skip transparent pixels
    const r = Math.min(255, Math.round(data[i] / step) * step);
    const g = Math.min(255, Math.round(data[i + 1] / step) * step);
    const b = Math.min(255, Math.round(data[i + 2] / step) * step);
    const key = `${r},${g},${b}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key]) => {
      const [r, g, b] = key.split(",").map(Number);
      return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
    });
}

function hexToRgb(hex) {
  const n = hex.replace("#", "");
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

// "redmean" weighted distance — closer to human color perception than plain Euclidean
export function colorDistance(hexA, hexB) {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
}

export function matchProducts(dominantHexes, products) {
  const scored = products.map((product) => {
    let distance = Infinity;
    let matchedColor = null;
    for (const c of product.colors || []) {
      if (!c?.hex) continue;
      for (const hex of dominantHexes) {
        const d = colorDistance(hex, c.hex);
        if (d < distance) {
          distance = d;
          matchedColor = c;
        }
      }
    }
    return { product, distance, matchedColor };
  });
  return scored.filter((s) => s.matchedColor).sort((a, b) => a.distance - b.distance);
}
