import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

const MB = 1024 * 1024;

const ALLOWED = {
  image: { dir: "images", exts: ["jpg", "jpeg", "png", "webp"], max: 10 * MB },
  glb: { dir: "models", exts: ["glb"], max: 100 * MB },
  usdz: { dir: "models", exts: ["usdz"], max: 100 * MB },
  video: { dir: "videos", exts: ["mp4", "webm", "mov"], max: 80 * MB },
};

const startsWith = (buf, bytes) => bytes.every((b, i) => buf[i] === b);

const MAGIC = {
  glb: (b) => startsWith(b, [0x67, 0x6c, 0x54, 0x46]),
  usdz: (b) => startsWith(b, [0x50, 0x4b]),
  jpg: (b) => startsWith(b, [0xff, 0xd8]),
  jpeg: (b) => startsWith(b, [0xff, 0xd8]),
  png: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47]),
  webp: (b) => startsWith(b, [0x52, 0x49, 0x46, 0x46]),
  mp4: (b) => startsWith(b.subarray(4), [0x66, 0x74, 0x79, 0x70]), // "ftyp" box
  mov: (b) => startsWith(b.subarray(4), [0x66, 0x74, 0x79, 0x70]),
  webm: (b) => startsWith(b, [0x1a, 0x45, 0xdf, 0xa3]),
};

export async function saveUpload(file, kind) {
  if (!file) return null;
  const config = ALLOWED[kind];
  if (!config) throw new Error("Noma'lum fayl turi");

  const ext = path.extname(file.name || "").toLowerCase().replace(".", "");
  if (!config.exts.includes(ext)) {
    throw new Error(`${kind} uchun ruxsat etilgan formatlar: ${config.exts.join(", ")}`);
  }
  if (file.size > config.max) {
    throw new Error(`Fayl juda katta (${Math.round(file.size / MB)} MB). Ruxsat etilgan: ${config.max / MB} MB gacha`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!MAGIC[ext](bytes)) {
    throw new Error(`"${file.name}" haqiqiy .${ext} fayl emas yoki buzilgan`);
  }

  let outBytes = bytes;
  let outExt = ext;
  if (kind === "image") {
    try {
      outBytes = await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      outExt = "webp";
    } catch {
      throw new Error(`"${file.name}" rasmini o'qib bo'lmadi`);
    }
  }

  const filename = `${crypto.randomUUID()}.${outExt}`;
  const uploadDir = path.join(process.cwd(), "uploads", config.dir);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), outBytes);

  return `/uploads/${config.dir}/${filename}`;
}
