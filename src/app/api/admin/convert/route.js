import { mkdtemp, rm, writeFile, mkdir, readdir, stat } from "fs/promises";
import os from "os";
import path from "path";
import AdmZip from "adm-zip";
import obj2gltf from "obj2gltf";
import { isAdmin, unauthorized } from "@/lib/adminAuth";

const MAX_BYTES = 200 * 1024 * 1024;

async function findObj(dir) {
  for (const name of await readdir(dir)) {
    const p = path.join(dir, name);
    if ((await stat(p)).isDirectory()) {
      const found = await findObj(p);
      if (found) return found;
    } else if (name.toLowerCase().endsWith(".obj")) {
      return p;
    }
  }
  return null;
}

export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();

  const tmp = await mkdtemp(path.join(os.tmpdir(), "convert-"));
  try {
    const file = (await request.formData()).get("file");
    if (!file || !file.size) return Response.json({ error: "Fayl tanlanmagan" }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ error: "Fayl juda katta (200 MB gacha)" }, { status: 400 });

    const ext = path.extname(file.name || "").toLowerCase();
    const bytes = Buffer.from(await file.arrayBuffer());
    let objPath;

    if (ext === ".zip") {
      const zip = new AdmZip(bytes);
      for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue;
        const target = path.resolve(tmp, entry.entryName);
        if (!target.startsWith(tmp + path.sep)) continue;
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, entry.getData());
      }
      objPath = await findObj(tmp);
      if (!objPath) return Response.json({ error: "Zip ichida .obj fayl topilmadi" }, { status: 400 });
    } else if (ext === ".obj") {
      objPath = path.join(tmp, "model.obj");
      await writeFile(objPath, bytes);
    } else {
      return Response.json({ error: "Faqat .zip yoki .obj fayl" }, { status: 400 });
    }

    const glb = await obj2gltf(objPath, { binary: true, secure: true });
    return new Response(glb, { headers: { "Content-Type": "model/gltf-binary" } });
  } catch (err) {
    return Response.json({ error: "Aylantirib bo'lmadi: " + (err.message || "noma'lum xato") }, { status: 400 });
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
