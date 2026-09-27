// Renders studio-style product previews from public/models/*.glb using local Chrome.
// Usage: node scripts/render_previews.mjs  (site must be running on RENDER_BASE, default http://localhost:3111)
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE = process.env.RENDER_BASE || "http://localhost:3111";
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "prisma/catalog.json"), "utf8"));
const only = process.argv[2];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 900, deviceScaleFactor: 1 });
await page.goto(BASE + "/cart", { waitUntil: "networkidle2" });

for (const item of catalog) {
  if (only && item.slug !== only) continue;
  const bg = item.bg || ["#fdf2e6", "#f6dcc4"];
  await page.evaluate(({ glb, bg }) => {
    document.documentElement.style.cssText = "margin:0;background:#fff";
    document.body.style.cssText = "margin:0;width:900px;height:900px;overflow:hidden";
    document.body.innerHTML = `
      <div id="stage" style="position:relative;width:900px;height:900px;background:
        radial-gradient(52% 34% at 50% 80%, rgba(60,40,20,.13), transparent 72%), #efe9e2">
        <model-viewer id="mv" src="${glb}" camera-orbit="-38deg 74deg 112%" field-of-view="26deg"
          shadow-intensity="1.6" shadow-softness="1" exposure="0.72" environment-image="legacy"
          interaction-prompt="none" style="width:900px;height:900px;background:transparent;--poster-color:transparent"></model-viewer>
      </div>`;
  }, { glb: item.glbUrl, bg });
  await page.waitForFunction(() => document.getElementById("mv")?.loaded === true, { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));
  const out = path.join(root, "public/products", item.slug + ".jpg");
  await (await page.$("#stage")).screenshot({ path: out, type: "jpeg", quality: 88 });
  console.log("rendered", item.slug);
}
await browser.close();
