"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, discountPercent, installmentPrice, warrantyLabel, STOCK } from "@/lib/format";
import { useCart, toast } from "@/lib/store";
import FavoriteButton from "@/components/FavoriteButton";
import ProductTabs from "@/components/ProductTabs";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function inAppBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/FBAN|FBAV|Instagram|Telegram|TikTok|Snapchat|Twitter|MicroMessenger|Line\//i.test(ua)) return true;
  return isIOS() && !/Safari\//.test(ua);
}

function hexToLinear(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return [lin(c[0]), lin(c[1]), lin(c[2]), 1];
}

export default function ProductDetail({ product, contact }) {
  const router = useRouter();
  const cart = useCart();
  const viewerRef = useRef(null);
  const has3d = Boolean(product.glbUrl || product.usdzUrl);
  const gallery = product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [];
  const [tab, setTab] = useState(has3d ? "3d" : "img");
  const [imgIdx, setImgIdx] = useState(0);
  const [arOk, setArOk] = useState(true);
  const [qty, setQty] = useState(1);
  const [dbg, setDbg] = useState(null);
  const inApp = useSyncExternalStore(() => () => {}, inAppBrowser, () => false);
  const [months, setMonths] = useState(product.installmentMonths || 0);
  const stock = product.stock || "in";
  const out = stock === "out";
  const warranty = warrantyLabel(product.warrantyMonths);
  const monthOptions = product.installmentMonths >= 2 ? [...new Set([3, 6, 9, 12, 18, 24].filter((m) => m < product.installmentMonths).concat(product.installmentMonths))].sort((a, b) => a - b) : [];
  const [color, setColor] = useState(null);
  const [modelReady, setModelReady] = useState(false);
  const originals = useRef(null);
  const colors = product.colors || [];
  const activeColor = colors.find((c) => c.name === color) || null;
  const off = discountPercent(product.price, product.oldPrice);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const check = () => setArOk(isIOS() || Boolean(el.canActivateAR));
    const onLoad = () => {
      originals.current = (el.model?.materials || []).map((m) => ({
        factor: [...m.pbrMetallicRoughness.baseColorFactor],
        metallic: m.pbrMetallicRoughness.metallicFactor,
        texture: m.pbrMetallicRoughness.baseColorTexture?.texture ?? null,
      }));
      setModelReady(true);
      check();
    };
    el.addEventListener("load", onLoad);
    el.addEventListener("ar-status", check);
    if (el.loaded) onLoad();
    check();
    let tries = 0;
    const timer = setInterval(() => {
      check();
      if (el.canActivateAR || ++tries > 25) clearInterval(timer);
    }, 400);
    return () => {
      clearInterval(timer);
      el.removeEventListener("load", onLoad);
      el.removeEventListener("ar-status", check);
      setModelReady(false);
    };
  }, [tab]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.search.includes("debug=1")) return;
    const t = setInterval(() => {
      const el = viewerRef.current;
      const a = document.createElement("a");
      setDbg(JSON.stringify({
        ua: navigator.userAgent,
        isIOS: isIOS(),
        relSupportsAR: Boolean(a.relList && a.relList.supports && a.relList.supports("ar")),
        canActivateAR: el ? el.canActivateAR : "no viewer",
        arModes: el?.getAttribute("ar-modes"),
        iosSrc: el?.getAttribute("ios-src"),
        usdzUrl: product.usdzUrl,
        loaded: el?.loaded,
        secure: window.isSecureContext,
        url: window.location.href,
      }, null, 1));
    }, 1000);
    return () => clearInterval(t);
  }, [product.usdzUrl]);

  useEffect(() => {
    const el = viewerRef.current;
    const saved = originals.current;
    if (!el || !modelReady || !el.model || !saved) return;
    el.model.materials.forEach((m, i) => {
      const pbr = m.pbrMetallicRoughness;
      const recolor = !product.colorParts || product.colorParts.includes(i);
      if (!activeColor || !recolor) {
        const o = saved[i];
        if (!o) return;
        pbr.setBaseColorFactor(o.factor);
        pbr.setMetallicFactor(o.metallic);
        pbr.baseColorTexture?.setTexture(o.texture);
      } else {
        pbr.setBaseColorFactor(hexToLinear(activeColor.hex));
        pbr.setMetallicFactor(0);
        pbr.baseColorTexture?.setTexture(null);
      }
    });
  }, [activeColor, modelReady, product.colorParts]);

  function openAR() {
    const el = viewerRef.current;

    if (inAppBrowser()) {
      toast("AR uchun bu sahifani Safari (iPhone) yoki Chrome (Android) da oching.");
      return;
    }

    if (isIOS() && product.usdzUrl && !activeColor) {
      const link = document.createElement("a");
      link.setAttribute("rel", "ar");
      link.setAttribute("href", `${product.usdzUrl}#allowsContentScaling=0`);
      link.style.cssText = "position:fixed;left:-1000px;top:0;width:1px;height:1px;opacity:0";
      const img = document.createElement("img");
      img.alt = "";
      link.appendChild(img);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => link.remove(), 1500);
      return;
    }

    if (!el) return;
    if (!isIOS() && !el.canActivateAR) {
      toast("AR faqat telefonda ishlaydi. Havolani telefoningizda oching.");
      return;
    }
    const warnings = [];
    const origWarn = console.warn;
    console.warn = (...args) => {
      warnings.push(args.join(" "));
      origWarn(...args);
    };
    Promise.resolve()
      .then(() => el.activateAR())
      .then(() => {
        setTimeout(() => {
          console.warn = origWarn;
          if (!el.canActivateAR) toast("Bu qurilmada AR ochilmadi. iPhone'da Safari, Android'da Chrome dan oching.");
        }, 600);
      })
      .catch((err) => {
        console.warn = origWarn;
        console.error("AR", err);
        toast("AR ochilmadi. iPhone'da Safari, Android'da Chrome dan oching.");
      });
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Havola nusxalandi");
      }
    } catch {}
  }

  function addToCart(go) {
    cart.add(product.id, qty, color);
    toast("Savatchaga qo'shildi");
    if (go) router.push("/cart");
  }

  const specs = [
    ["Kategoriya", product.categoryName],
    ["Material", product.material],
    ["Kafolat", warranty],
    ["Mavjudlik", STOCK[stock]?.label],
    ["Rang", product.color],
    ["O'lcham (eni x chuq. x bal.)", [product.width, product.depth, product.height].every(Boolean) ? `${product.width} x ${product.depth} x ${product.height} sm` : null],
  ].filter(([, v]) => v);

  return (
    <>
      <div className="mx-auto max-w-6xl md:px-4 md:py-8 grid grid-cols-[minmax(0,1fr)] gap-0 md:gap-10 md:grid-cols-2">
        {/* GALLERY */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="relative overflow-hidden md:rounded-lg bg-slate-100 md:border border-line">
            {tab === "3d" && has3d ? (
              <model-viewer suppressHydrationWarning
                ref={viewerRef}
                src={product.glbUrl || undefined}
                ios-src={activeColor ? undefined : product.usdzUrl || undefined}
                alt={product.name}
                ar
                ar-modes="webxr scene-viewer quick-look"
                ar-scale="fixed"
                camera-controls
                auto-rotate
                shadow-intensity="1.1"
                shadow-softness="1"
                exposure="1.05"
                style={{ width: "100%", height: "min(88vw, 480px)", background: "transparent" }}
              />
            ) : gallery.length > 0 ? (
              <img key={gallery[imgIdx]} src={gallery[imgIdx]} alt={product.name} className="animate-fade-in w-full aspect-square object-cover" />
            ) : (
              <div className="grid aspect-square place-items-center text-neutral-400 text-sm">Rasm yo&apos;q</div>
            )}

            <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
              {off > 0 && <span className="rounded-sm bg-accent text-white text-xs font-semibold px-2 py-1">-{off}%</span>}
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              <button type="button" onClick={share} aria-label="Ulashish" className="h-10 w-10 grid place-items-center rounded-full bg-white/95 active:scale-90 transition-transform">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v11M8 8l4-4 4 4M5 13v6h14v-6" stroke="#44403c" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <FavoriteButton id={product.id} className="h-10 w-10" />
            </div>

            {has3d && tab === "3d" && (
              <button
                type="button"
                onClick={openAR}
                className="btn-primary animate-pulse-ring absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 text-sm flex items-center gap-2 whitespace-nowrap"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l9 4.9v10.2L12 22l-9-4.9V6.9L12 2z" stroke="white" strokeWidth="2" strokeLinejoin="round" /><path d="M12 12l9-5M12 12L3 7M12 12v10" stroke="white" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                AR da ko&apos;rish
              </button>
            )}
          </div>

          {(gallery.length > 1 || (has3d && gallery.length > 0)) && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 md:px-0 pt-3">
              {has3d && (
                <button
                  type="button"
                  onClick={() => setTab("3d")}
                  aria-label="3D model"
                  className={`shrink-0 h-16 w-16 rounded-md border-2 grid place-items-center bg-ink text-white text-xs font-medium transition-all ${tab === "3d" ? "border-brand" : "border-transparent opacity-80 hover:opacity-100"}`}
                >
                  3D
                </button>
              )}
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => { setTab("img"); setImgIdx(i); }}
                  aria-label={`Rasm ${i + 1}`}
                  className={`shrink-0 h-16 w-16 overflow-hidden rounded-md border-2 transition-all ${tab === "img" && imgIdx === i ? "border-ink" : "border-transparent opacity-80 hover:opacity-100"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {has3d && tab === "3d" && inApp && (
            <div className="animate-fade-in mx-4 md:mx-0 mt-3 rounded-2xl border border-sky-200 bg-sky-50 p-3.5 text-[13px] leading-snug text-sky-900">
              <b>AR ishlashi uchun brauzerda oching.</b> Siz Telegram, Instagram kabi ilova ichidagi brauzerdasiz, u AR ni ochmaydi.
              iPhone&apos;da pastdagi <b>kompas belgisini</b> yoki <b>⋯ menyu, &quot;Safari&apos;da ochish&quot;</b> ni bosing.
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast("Havola nusxalandi. Safari'ga tashlang");
                  } catch {}
                }}
                className="ml-1 font-semibold underline"
              >
                Havolani nusxalash
              </button>
            </div>
          )}

          {has3d && tab === "3d" && !inApp && !arOk && (
            <div className="animate-fade-in mx-4 md:mx-0 mt-3 rounded-lg border border-line bg-white p-3.5 text-[13px] text-neutral-700 leading-snug">
              AR faqat telefon yoki planshetda ishlaydi. Havolani telefoningizga yuboring va shu sahifada «AR da ko&apos;rish» tugmasini bosing.
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast("Havola nusxalandi");
                  } catch {}
                }}
                className="ml-1 font-semibold underline"
              >
                Havolani nusxalash
              </button>
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="px-4 py-6 md:p-0 flex flex-col gap-5">
          <div>
            <Link href={`/catalog/${product.categorySlug}`} className="cap inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-brand hover:underline">
              {product.categoryName}
            </Link>
            <h1 className="mt-2 text-3xl md:text-[2.75rem] leading-[1.08]">{product.name}</h1>
            <div className="mt-3 flex items-baseline gap-3 flex-wrap">
              <p className="text-3xl font-semibold text-ink">{formatPrice(product.price)}</p>
              {product.oldPrice && <p className="text-base text-neutral-400 line-through">{formatPrice(product.oldPrice)}</p>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className={`rounded-sm px-2.5 py-1 ${STOCK[stock]?.tone}`}>
                {STOCK[stock]?.label}{stock === "order" && product.leadDays ? `, ~${product.leadDays} kun` : ""}
              </span>
              {warranty && <span className="rounded-sm bg-neutral-100 px-2.5 py-1 text-neutral-700">Kafolat: {warranty}</span>}
            </div>
            {monthOptions.length > 0 && (
              <div className="mt-3 rounded-lg border border-line bg-white p-4">
                <p className="text-xs font-semibold text-neutral-600">Bo&apos;lib to&apos;lash</p>
                <p className="mt-1 text-lg font-semibold text-ink">
                  oyiga {formatPrice(installmentPrice(product.price, months) || 0)} <span className="text-sm font-semibold text-neutral-500">x {months} oy</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {monthOptions.map((m) => (
                    <button key={m} type="button" onClick={() => setMonths(m)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${months === m ? "bg-ink text-white" : "bg-white text-neutral-600 border border-neutral-200 hover:border-brand"}`}>
                      {m} oy
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-snug text-neutral-400">Hisob-kitob taxminiy. Aniq shartlar operator bilan kelishiladi.</p>
              </div>
            )}
          </div>

          {colors.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">
                Rang: <span className="font-normal text-neutral-600">{activeColor ? activeColor.name : "Asl rang"}</span>
              </p>
              <div className="flex flex-wrap gap-2.5">
                {has3d && (
                  <button
                    type="button"
                    onClick={() => setColor(null)}
                    aria-label="Asl rang"
                    title="Asl rang"
                    className={`h-10 w-10 rounded-full border-2 transition-all ${!activeColor ? "border-ink scale-110" : "border-transparent ring-1 ring-line hover:scale-105"}`}
                    style={{ background: "conic-gradient(#c9a67e, #a23b2e, #4f5d75, #6b8f71, #c9a67e)" }}
                  />
                )}
                {colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    aria-label={c.name}
                    title={c.name}
                    className={`h-10 w-10 rounded-full border-2 transition-all ${activeColor?.name === c.name ? "border-ink scale-110" : "border-transparent ring-1 ring-line hover:scale-105"}`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              {has3d && activeColor && (
                <p className="mt-2 text-[11px] text-neutral-400 leading-snug">
                  Rang 3D ko&apos;rinishda darhol almashadi. AR&apos;da ba&apos;zi telefonlarda asl rang chiqishi mumkin.
                </p>
              )}
            </div>
          )}

          {product.description && <p className="text-[15px] leading-relaxed text-neutral-700 whitespace-pre-line">{product.description}</p>}

          {out ? (
            <div className="hidden md:block rounded-md bg-neutral-100 py-3.5 text-center font-medium text-neutral-500">Hozircha mavjud emas</div>
          ) : (
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center rounded-md border border-line bg-white">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="h-12 w-12 text-xl hover:text-brand" aria-label="Kamaytirish">−</button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(99, qty + 1))} className="h-12 w-12 text-xl hover:text-brand" aria-label="Ko'paytirish">+</button>
            </div>
            <button type="button" onClick={() => addToCart(false)} className="flex-1 btn-outline py-3.5">
              Savatchaga
            </button>
            <button type="button" onClick={() => addToCart(true)} className="btn-primary flex-1 py-3.5">
              Buyurtma berish
            </button>
          </div>
          )}

          {contact && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold">Sotuvchi bilan bog&apos;lanish</p>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <a
                  href={
                    contact.bot
                      ? `https://t.me/${contact.bot}?start=p_${product.id}${activeColor ? `_${colors.findIndex((c) => c.name === activeColor.name)}` : ""}`
                      : contact.telegram
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-md bg-[#229ED9] px-4 py-3 text-sm font-medium text-white transition hover:brightness-110 active:scale-[0.985]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 4L3 11l6 2 2 6 3-4 5 4 2-15z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                  {contact.bot ? "Telegramda buyurtma" : "Telegramda yozish"}
                </a>
                <a href={contact.phoneHref} className="flex items-center justify-center gap-2 rounded-md border border-line px-4 py-3 text-sm font-medium transition hover:border-ink active:scale-[0.985]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                  {contact.phone}
                </a>
              </div>
              {contact.bot && <p className="mt-2 text-[11px] text-neutral-400">Bot mahsulotni ko&apos;rsatadi, telefon va manzilingizni so&apos;rab buyurtma qabul qiladi.</p>}
            </div>
          )}

          <ul className="grid grid-cols-3 gap-2 text-center text-[11px] md:text-xs text-neutral-600">
            {[["Haqiqiy o'lcham", "M12 3v18M3 12h18"], ["3D aylantirish", "M12 2l9 4.9v10.2L12 22l-9-4.9V6.9L12 2z"], ["Operator maslahati", "M4 5h16v11H8l-4 4V5z"]].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-white border border-neutral-200 py-3 px-2">
                <svg className="mx-auto mb-1.5 text-brand" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8">
        <ProductTabs specs={specs} delivery={product.deliveryText} warranty={product.warrantyText} />
      </div>

      {dbg && <pre className="mx-4 my-4 overflow-x-auto rounded-xl bg-neutral-900 p-3 text-[10px] leading-snug text-green-300 whitespace-pre-wrap break-all">{dbg}</pre>}

      {/* MOBILE STICKY BAR */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] flex items-center gap-2.5 animate-slide-up">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[11px] text-neutral-400">Narxi</p>
          <p className="font-semibold text-ink truncate">{formatPrice(product.price * qty)}</p>
        </div>
        {has3d && (
          <button type="button" onClick={() => { setTab("3d"); openAR(); }} aria-label="AR da ko'rish" className="h-12 w-12 shrink-0 grid place-items-center rounded-md border border-ink text-ink active:scale-90 transition-transform">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2l9 4.9v10.2L12 22l-9-4.9V6.9L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M12 12l9-5M12 12L3 7M12 12v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          </button>
        )}
        {out ? (
          <span className="flex h-12 shrink-0 items-center rounded-md bg-neutral-200 px-6 text-sm font-medium text-neutral-500">Tugagan</span>
        ) : (
          <button type="button" onClick={() => addToCart(true)} className="btn-primary h-12 px-6 text-sm shrink-0">
            Buyurtma
          </button>
        )}
      </div>
    </>
  );
}
