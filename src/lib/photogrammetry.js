// Photos -> 3D model jobs. Runs Apple Object Capture (scripts/photogrammetry/main.swift)
// as a child process on this Mac, then converts its OBJ to GLB and scales it to real size.
import { spawn, execFile } from "child_process";
import { promisify } from "util";
import { access, mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises";
import crypto from "crypto";
import os from "os";
import path from "path";
import obj2gltf from "obj2gltf";
import { prisma } from "@/lib/prisma";
import { notifyOwnersModelReady } from "@/lib/telegram";

const execFileAsync = promisify(execFile);

const ROOT = process.cwd();
const TOOL = path.join(ROOT, ".tools", "photogrammetry");
const SOURCE = path.join(ROOT, "scripts", "photogrammetry", "main.swift");
const JOBS_DIR = path.join(os.tmpdir(), "mebel3d-photogrammetry");

export const MIN_IMAGES = 20;
export const MAX_IMAGES = 300;
const MAX_IMAGE_BYTES = 40 * 1024 * 1024;
const JOB_TTL_MS = 24 * 60 * 60 * 1000;
const IMAGE_EXT = { "image/jpeg": "jpg", "image/png": "png", "image/heic": "heic", "image/heif": "heic" };

// Survives dev-server module reloads.
const jobs = (globalThis.__photogrammetryJobs ??= new Map());

export class JobError extends Error {}

export function isSupportedHost() {
  return process.platform === "darwin" && process.arch === "arm64";
}

function publicJob(job) {
  const { id, status, progress, images, error, warnings, createdAt, productId, attachedUrl } = job;
  return { id, status, progress, images, error, warnings: warnings.slice(-5), createdAt, productId, attached: Boolean(attachedUrl) };
}

async function cleanupOld() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS && job.status !== "running") {
      jobs.delete(id);
      await rm(job.dir, { recursive: true, force: true });
    }
  }
}

export async function createJob({ productId } = {}) {
  if (!isSupportedHost()) throw new JobError("Rasmlardan 3D yaratish faqat Apple Silicon (M1/M2/M3) Mac serverda ishlaydi.");
  if (productId && !(await prisma.product.findUnique({ where: { id: productId }, select: { id: true } }))) {
    throw new JobError("Mahsulot topilmadi.");
  }
  await cleanupOld();
  const id = crypto.randomUUID();
  const dir = path.join(JOBS_DIR, id);
  await mkdir(path.join(dir, "images"), { recursive: true });
  const job = { id, dir, status: "collecting", progress: 0, images: 0, error: null, warnings: [], createdAt: Date.now(), child: null, productId: productId || null, attachedUrl: null };
  jobs.set(id, job);
  return publicJob(job);
}

export function getJob(id) {
  const job = jobs.get(id);
  return job ? publicJob(job) : null;
}

function requireJob(id) {
  const job = jobs.get(id);
  if (!job) throw new JobError("Vazifa topilmadi yoki muddati o'tgan. Qaytadan boshlang.");
  return job;
}

export async function addImage(id, file) {
  const job = requireJob(id);
  if (job.status !== "collecting") throw new JobError("Rasm qo'shish yopilgan.");
  if (job.images >= MAX_IMAGES) throw new JobError(`Ko'pi bilan ${MAX_IMAGES} ta rasm.`);
  const ext = IMAGE_EXT[file.type] || (/\.(heic|heif)$/i.test(file.name || "") ? "heic" : null);
  if (!ext) throw new JobError("Faqat JPG, PNG yoki HEIC rasm.");
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new JobError("Rasm hajmi 40 MB dan oshmasin.");
  const index = job.images++;
  await writeFile(path.join(job.dir, "images", `img_${String(index).padStart(4, "0")}.${ext}`), Buffer.from(await file.arrayBuffer()));
  return publicJob(job);
}

async function ensureTool() {
  try {
    const [tool, src] = await Promise.all([stat(TOOL), stat(SOURCE)]);
    if (tool.mtimeMs >= src.mtimeMs) return;
  } catch {}
  await mkdir(path.dirname(TOOL), { recursive: true });
  await execFileAsync("swiftc", ["-O", SOURCE, "-o", TOOL], { timeout: 5 * 60 * 1000 });
}

async function findObj(dir) {
  const name = (await readdir(dir)).find((n) => n.toLowerCase().endsWith(".obj"));
  if (!name) throw new Error("Model fayli yaratilmadi");
  return path.join(dir, name);
}

// Object Capture from plain photos has no real-world scale; rescale so the model's
// height matches the furniture's real height, which AR needs to show true size.
async function scaleObj(objPath, heightCm) {
  const text = await readFile(objPath, "utf8");
  let minY = Infinity;
  let maxY = -Infinity;
  for (const line of text.split("\n")) {
    if (line.startsWith("v ")) {
      const y = parseFloat(line.split(/\s+/)[2]);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const current = maxY - minY;
  if (!(current > 0)) return;
  const k = heightCm / 100 / current;
  const out = text
    .split("\n")
    .map((line) => {
      if (!line.startsWith("v ")) return line;
      const [, x, y, z, ...rest] = line.split(/\s+/);
      return ["v", parseFloat(x) * k, (parseFloat(y) - minY) * k, parseFloat(z) * k, ...rest].join(" ");
    })
    .join("\n");
  await writeFile(objPath, out);
}

export async function startJob(id, { heightCm, detail }) {
  const job = requireJob(id);
  if (job.status !== "collecting") throw new JobError("Bu vazifa allaqachon boshlangan.");
  if (job.images < MIN_IMAGES) throw new JobError(`Kamida ${MIN_IMAGES} ta rasm kerak (hozir ${job.images} ta).`);
  if ([...jobs.values()].some((j) => j.status === "running" || j.status === "converting")) {
    throw new JobError("Hozir boshqa model yasalmoqda. U tugagach urinib ko'ring.");
  }

  job.status = "running";
  job.progress = 0;
  const height = Number(heightCm) > 0 ? Math.min(Number(heightCm), 500) : null;
  const level = ["reduced", "medium"].includes(detail) ? detail : "reduced";

  (async () => {
    try {
      await ensureTool();
      const outDir = path.join(job.dir, "out");
      await rm(outDir, { recursive: true, force: true });
      await new Promise((resolve, reject) => {
        const child = spawn(TOOL, [path.join(job.dir, "images"), outDir, level]);
        job.child = child;
        let buffer = "";
        let lastError = null;
        child.stdout.on("data", (chunk) => {
          buffer += chunk;
          let nl;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            try {
              const msg = JSON.parse(line);
              if (msg.type === "progress") job.progress = Math.max(job.progress, Math.min(0.97, msg.value));
              else if (msg.type === "warning") job.warnings.push(msg.message);
              else if (msg.type === "error") lastError = msg.message;
            } catch {}
          }
        });
        child.on("error", reject);
        child.on("close", (code) => {
          job.child = null;
          if (code === 0) resolve();
          else reject(new Error(lastError || `Jarayon to'xtadi (kod ${code})`));
        });
      });

      job.status = "converting";
      const objPath = await findObj(outDir);
      if (height) await scaleObj(objPath, height);
      const glb = await obj2gltf(objPath, { binary: true, secure: true });
      await writeFile(path.join(job.dir, "model.glb"), glb);
      if (job.productId) await attachToProduct(job, glb);
      job.progress = 1;
      job.status = "done";
    } catch (err) {
      job.status = "error";
      job.error = friendly(err.message);
    }
  })();

  return publicJob(job);
}

// Saves the model as the product's 3D file right away, so it lands even if the phone
// that started the scan was closed. The old .usdz and color-part mapping no longer match.
async function attachToProduct(job, glb) {
  const dir = path.join(ROOT, "uploads", "models");
  await mkdir(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}.glb`;
  await writeFile(path.join(dir, filename), glb);
  job.attachedUrl = `/uploads/models/${filename}`;
  const product = await prisma.product.update({
    where: { id: job.productId },
    data: { glbUrl: job.attachedUrl, usdzUrl: null, colorParts: null },
    select: { id: true, name: true },
  });
  notifyOwnersModelReady(product).catch((e) => console.error("[telegram] model notify failed", e));
}

function friendly(message = "") {
  if (/not enough|insufficient|too few|error 6\b/i.test(message)) return "Rasmlar yetarli emas yoki bir-biriga o'xshamaydi. Mebel atrofida ko'proq burchakdan suratga oling.";
  if (/cancel/i.test(message)) return "Bekor qilindi.";
  return "Model yasab bo'lmadi: " + message;
}

export async function cancelJob(id) {
  const job = jobs.get(id);
  if (!job) return;
  job.child?.kill("SIGTERM");
  jobs.delete(id);
  await rm(job.dir, { recursive: true, force: true });
}

export async function readResult(id) {
  const job = requireJob(id);
  if (job.status !== "done") throw new JobError("Model hali tayyor emas.");
  const file = path.join(job.dir, "model.glb");
  await access(file);
  return readFile(file);
}
