import { open, stat } from "fs/promises";
import path from "path";

const TYPES = {
  ".glb": "model/gltf-binary",
  ".usdz": "model/vnd.usdz+zip",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(request, { params }) {
  const { path: parts } = await params;
  const root = path.join(process.cwd(), "uploads");
  const file = path.join(root, ...parts);
  const type = TYPES[path.extname(file).toLowerCase()];

  if (!type || !file.startsWith(root + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const info = await stat(file);
    const headers = { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes" };

    // Videos need Range support to seek/scrub and to even start playing reliably on iOS Safari.
    const range = request.headers.get("range");
    if (range) {
      const m = range.match(/bytes=(\d*)-(\d*)/);
      const start = m?.[1] ? parseInt(m[1], 10) : 0;
      const end = m?.[2] ? parseInt(m[2], 10) : info.size - 1;
      const clampedEnd = Math.min(end, info.size - 1);
      if (start > clampedEnd || start >= info.size) {
        return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${info.size}` } });
      }
      const fh = await open(file, "r");
      const chunkSize = clampedEnd - start + 1;
      const buf = Buffer.alloc(chunkSize);
      await fh.read(buf, 0, chunkSize, start);
      await fh.close();
      return new Response(buf, {
        status: 206,
        headers: { ...headers, "Content-Length": String(chunkSize), "Content-Range": `bytes ${start}-${clampedEnd}/${info.size}` },
      });
    }

    const fh = await open(file, "r");
    const buf = Buffer.alloc(info.size);
    await fh.read(buf, 0, info.size, 0);
    await fh.close();
    return new Response(buf, { headers: { ...headers, "Content-Length": String(info.size) } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
