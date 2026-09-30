"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { extractDominantColors, matchProducts } from "@/lib/colorMatch";
import { checkRoomPhoto } from "@/lib/roomCheck";
import CameraCapture, { canUseLiveCamera } from "@/components/CameraCapture";

const HIDDEN_CATEGORIES = new Set(["sumka"]);

const ROOMS = [
  { id: "yotoqxona", name: "Yotoqxona", slugs: ["krevatlar", "shkaflar"] },
  { id: "mehmonxona", name: "Mehmonxona", slugs: ["divanlar", "stollar", "shkaflar"] },
  { id: "oshxona", name: "Oshxona", slugs: ["stollar", "stullar"] },
  { id: "bolalar", name: "Bolalar xonasi", slugs: ["krevatlar", "shkaflar", "stollar"] },
  { id: "ish", name: "Ish xonasi", slugs: ["ofis-mebeli", "stollar", "stullar", "shkaflar"] },
  { id: "dahliz", name: "Dahliz", slugs: ["shkaflar"] },
];

export default function RoomStylist() {
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [products, setProducts] = useState(null);
  const [selected, setSelected] = useState([]);
  const [room, setRoom] = useState(null);
  const [preview, setPreview] = useState(null);
  const [palette, setPalette] = useState([]);
  const [rejected, setRejected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products-colors")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((list) => setProducts(list.filter((p) => p.category && !HIDDEN_CATEGORIES.has(p.category.slug))))
      .catch(() => setError("Mahsulotlarni yuklab bo'lmadi. Sahifani yangilang."));
  }, []);

  const categories = useMemo(() => {
    const map = new Map();
    for (const p of products || []) if (!map.has(p.category.slug)) map.set(p.category.slug, p.category.name);
    return [...map].map(([slug, name]) => ({ slug, name }));
  }, [products]);

  const groups = useMemo(() => {
    if (selected.length === 0 || palette.length === 0 || !products) return null;
    return categories
      .filter((c) => selected.includes(c.slug))
      .map((c) => ({ ...c, matches: matchProducts(palette, products.filter((p) => p.category.slug === c.slug)).slice(0, 6) }));
  }, [selected, palette, products, categories]);

  const toggleCategory = (slug) => {
    setRoom(null);
    setSelected((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  };

  const available = new Set(categories.map((c) => c.slug));
  const rooms = ROOMS.map((r) => ({ ...r, slugs: r.slugs.filter((s) => available.has(s)) })).filter((r) => r.slugs.length > 0);

  const pickRoom = (r) => {
    if (room === r.id) {
      setRoom(null);
      setSelected([]);
    } else {
      setRoom(r.id);
      setSelected(r.slugs);
    }
  };

  function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) processImage(URL.createObjectURL(file));
  }

  function openCamera() {
    setError("");
    if (canUseLiveCamera()) setCameraOpen(true);
    else cameraRef.current?.click();
  }

  const closeCamera = useCallback(() => setCameraOpen(false), []);
  const cameraUnavailable = useCallback(() => {
    setCameraOpen(false);
    setError("Kamerani ochib bo'lmadi. Brauzerda kameraga ruxsat bering yoki galereyadan tanlang.");
  }, []);

  async function processImage(url) {
    setCameraOpen(false);
    setError("");
    setPalette([]);
    setRejected(null);
    setLoading(true);
    setPreview(url);
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      const colors = extractDominantColors(img, 5);
      let check;
      try {
        check = await checkRoomPhoto(img);
      } catch {
        check = { ok: true };
      }
      if (check.ok) setPalette(colors);
      else setRejected(colors);
    } catch {
      setError("Rasmni o'qib bo'lmadi. Boshqa rasm bilan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <p className="eyebrow text-brand">AI interyer stilist</p>
      <h1 className="mt-2 font-display text-3xl leading-tight md:text-4xl">Xonangiz rangiga mos mebel toping</h1>
      <p className="mt-3 max-w-xl text-sm text-neutral-500 md:text-base">
        Nima qo&apos;ymoqchi ekaningizni tanlang, so&apos;ng mebel turadigan xona rasmini yuklang — xona ranglariga mos variantlarni saralab beramiz.
      </p>

      <div className="mt-8">
        <p className="text-sm font-semibold text-ink">1. Qaysi xona uchun?</p>
        <p className="mt-1 text-xs text-neutral-500">Xona turini tanlang — kerakli mebellar o&apos;zi belgilanadi. Yoki pastdan aniq turlarni tanlang.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {products === null && !error && <span className="text-sm text-neutral-400">Yuklanmoqda...</span>}
          {rooms.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={room === r.id}
              onClick={() => pickRoom(r)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${room === r.id ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand hover:text-brand"}`}
            >
              {r.name}
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs font-medium uppercase tracking-widest text-neutral-400">Mebel turi</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              aria-pressed={selected.includes(c.slug)}
              onClick={() => toggleCategory(c.slug)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selected.includes(c.slug) ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className={`text-sm font-semibold ${selected.length ? "text-ink" : "text-neutral-400"}`}>2. Xona rasmini yuklang</p>
        <p className="mt-1 text-xs text-neutral-500">Devor, pol va mavjud jihozlar ko&apos;rinib turgan umumiy rasm eng yaxshi natija beradi.</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button type="button" disabled={selected.length === 0} onClick={openCamera} className="btn-primary flex items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-40">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.8" /></svg>
              Kamerada olish
            </button>
            <button type="button" disabled={selected.length === 0} onClick={() => fileRef.current?.click()} className="btn-outline flex items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-40">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 16l5-5 4 4 3-3 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="15.5" cy="9" r="1.5" fill="currentColor" /></svg>
              Galereyadan
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          {preview && (
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-line">
              <img src={preview} alt="Yuklangan xona" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
        {selected.length === 0 && <p className="mt-2 text-xs text-neutral-400">Avval yuqoridan mebel turini tanlang.</p>}
      </div>

      {loading && <p className="mt-6 text-sm text-neutral-500">Rasm tekshirilmoqda...</p>}
      {rejected && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Bu rasm xonaga o&apos;xshamaydi</p>
          <p className="mt-1 text-sm text-amber-800">Mebel turadigan xonaning umumiy ko&apos;rinishini yuklang: devor, pol va jihozlar ko&apos;rinib tursin.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={openCamera} className="btn-primary px-4 py-2 text-xs">Qayta suratga olish</button>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline px-4 py-2 text-xs">Galereyadan tanlash</button>
            <button type="button" onClick={() => { setPalette(rejected); setRejected(null); }} className="btn-outline px-4 py-2 text-xs">Bu xona rasmi, davom etish</button>
          </div>
        </div>
      )}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {palette.length > 0 && (
        <div className="mt-6 flex items-center gap-2">
          <span className="text-xs text-neutral-500">Xonangiz ranglari:</span>
          {palette.map((hex) => (
            <span key={hex} className="h-6 w-6 rounded-full border border-line" style={{ background: hex }} />
          ))}
        </div>
      )}

      {groups?.map((g) => (
        <div key={g.slug} className="mt-10">
          <p className="text-sm font-semibold text-ink">{g.name}: xonangizga mos {g.matches.length} ta variant</p>
          {g.matches.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">Bu turda rang variantli mebel topilmadi.</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
              {g.matches.map(({ product, matchedColor }) => (
                <Link key={product.id} href={`/product/${product.id}`} className="card-lift group overflow-hidden rounded-lg border border-line bg-white">
                  <div className="relative aspect-square bg-slate-100">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.name} loading="lazy" className="absolute inset-0 h-full w-full object-contain p-3 mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-[13px] font-medium text-ink">{product.name}</p>
                    {matchedColor && (
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <span className="h-3 w-3 rounded-full border border-line" style={{ background: matchedColor.hex }} />
                        Mos rang: {matchedColor.name}
                      </p>
                    )}
                    <p className="mt-1 text-[13px] font-semibold text-ink">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
      {cameraOpen && <CameraCapture onCapture={processImage} onClose={closeCamera} onUnavailable={cameraUnavailable} />}
    </div>
  );
}
