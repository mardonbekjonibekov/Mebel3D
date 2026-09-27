import { readFile } from "fs/promises";
import path from "path";

const TYPES = {
  ".glb": "model/gltf-binary",
  ".usdz": "model/vnd.usdz+zip",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
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
    const data = await readFile(file);
    return new Response(data, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
