// Finds (and with --fix rewrites) Tailwind classes that have a shorter canonical form,
// using the same engine as the VS Code "Tailwind CSS IntelliSense" suggestCanonicalClasses warning.
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import * as tw from "tailwindcss";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const fix = process.argv.includes("--fix");

const css = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");
const ds = await tw.__unstable__loadDesignSystem(css, {
  base: path.join(root, "src/app"),
  loadStylesheet: async (id, base) => {
    const file = id === "tailwindcss" ? require.resolve("tailwindcss/index.css") : require.resolve(id.startsWith("tailwindcss/") ? id + (id.endsWith(".css") ? "" : ".css") : id, { paths: [base] });
    return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") };
  },
});

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

let total = 0;
for (const file of walk(path.join(root, "src"))) {
  const src = fs.readFileSync(file, "utf8");
  const tokens = new Set();
  for (const m of src.matchAll(/[^\s"'`]+/g)) {
    const t = m[0];
    if (t.includes("${") || t.includes("}") || t.length > 80 || !/[-\[]/.test(t)) continue;
    tokens.add(t);
  }
  const list = [...tokens];
  let canon;
  try {
    canon = ds.canonicalizeCandidates(list, { rem: 16 });
  } catch {
    continue;
  }
  const changes = [];
  list.forEach((t, i) => {
    if (canon[i] && canon[i] !== t) changes.push([t, canon[i]]);
  });
  if (!changes.length) continue;
  let out = src;
  for (const [from, to] of changes) {
    const lines = src.split("\n");
    lines.forEach((ln, idx) => {
      if (ln.includes(from)) console.log(`${path.relative(root, file)}:${idx + 1}  ${from}  ->  ${to}`);
    });
    total++;
    if (fix) out = out.split(from).join(to);
  }
  if (fix && out !== src) fs.writeFileSync(file, out);
}
console.log(total ? `\n${total} class(es) ${fix ? "rewritten" : "can be shortened"}` : "No canonical-class suggestions found.");
