// Zero-cost "AI" search: rule-based free-text parser, no external API calls.
// Turns a free-form Uzbek sentence into the same filter shape queryProducts() already accepts.

const PRICE_UNIT_RE = /(\d+(?:[.,]\d+)?)\s*(mln|million|milion|ming|so'?m|sum)?/gi;

const STOPWORDS = new Set([
  "uchun", "kerak", "menga", "biz", "bizga", "sizga", "bor", "bormi", "narxi", "qancha",
  "qanaqa", "yordam", "iltimos", "va", "yoki", "bilan", "gacha", "dan", "juda", "judayam",
  "kichkina", "katta", "yaxshi", "top", "toping", "bera", "olsam", "olaman", "mebel", "mebellar",
  "sotib", "olmoqchiman", "kerakmi", "biror", "narsa", "bitta", "rangda", "rang", "uyga", "xona",
  "xonaga", "xonam", "uchunam", "kerakku", "assalomu", "alaykum", "salom", "rahmat", "xayr",
]);

// Product/category/color names are stored in Latin script, but a customer may well
// type in Uzbek Cyrillic — transliterate before matching so both scripts work.
const CYRILLIC_TO_LATIN = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "'", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ў: "o'", қ: "q", ғ: "g'", ҳ: "h",
};

function cyrillicToLatin(text) {
  return text.replace(/[а-яёўқғҳ]/g, (ch) => CYRILLIC_TO_LATIN[ch] ?? ch);
}

function tokenize(text) {
  return text.toLowerCase().split(/[^\p{L}\p{N}'’ʻ]+/u).filter(Boolean);
}

// Word-boundary aware phrase match — plain `text.includes(word)` would also match
// short words hiding inside unrelated ones (e.g. "oq" inside "yotoqxona").
function phraseMatches(tokens, phrase) {
  const words = phrase.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 1) return tokens.includes(words[0]);
  const tokenStr = ` ${tokens.join(" ")} `;
  return tokenStr.includes(` ${words.join(" ")} `);
}

function extractPrice(text) {
  const values = [];
  PRICE_UNIT_RE.lastIndex = 0;
  let m;
  while ((m = PRICE_UNIT_RE.exec(text))) {
    let num = parseFloat(m[1].replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) continue;
    const unit = m[2]?.toLowerCase();
    if (unit === "mln" || unit === "million" || unit === "milion") num *= 1_000_000;
    else if (unit === "ming") num *= 1_000;
    else if (!unit && num < 100_000) continue; // bare small number is too ambiguous to be a price
    values.push(num);
  }
  if (values.length === 0) return {};
  if (values.length >= 2) {
    const sorted = [...values].sort((a, b) => a - b);
    return { min: sorted[0], max: sorted[sorted.length - 1] };
  }
  const v = values[0];
  const above = ["qimmat", "yuqori", "dan ko'p", "dan ortiq"];
  if (above.some((w) => text.includes(w))) return { min: v };
  return { max: v };
}

export function parseAiQuery(text, { categories = [], colors = [], materials = [] } = {}) {
  const clean = cyrillicToLatin(text.toLowerCase().trim());
  const tokens = tokenize(clean);

  const category = categories.find((c) => {
    const lower = c.name.toLowerCase();
    return clean.includes(lower) || tokens.some((t) => t.length >= 4 && lower.includes(t));
  });

  const color = colors.find((name) => phraseMatches(tokens, name));
  const material = materials.find((mat) => phraseMatches(tokens, mat));
  const price = extractPrice(clean);

  const ar = ["3d", " ar ", "ar'", "aylantir"].some((k) => clean.includes(k));
  const sale = ["chegirma", "aksiya", "skidka"].some((k) => clean.includes(k));
  const instock = ["omborda", "tayyor turgan", "hoziroq"].some((k) => clean.includes(k));
  const warranty = clean.includes("kafolat");

  let q;
  if (!category && !color && !material && !price.min && !price.max) {
    const candidate = tokens
      .filter((t) => t.length >= 4 && !STOPWORDS.has(t))
      .sort((a, b) => b.length - a.length)[0];
    if (candidate) q = candidate;
  }

  return {
    categorySlug: category?.slug,
    categoryName: category?.name,
    color,
    material,
    min: price.min,
    max: price.max,
    ar,
    sale,
    instock,
    warranty,
    q,
  };
}
