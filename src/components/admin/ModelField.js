"use client";

import { useEffect, useRef, useState } from "react";
import ModelEditor from "@/components/admin/ModelEditor";

const toSrgbHex = (f) =>
  "#" +
  f
    .slice(0, 3)
    .map((v) => {
      const s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
      return Math.round(Math.min(1, Math.max(0, s)) * 255).toString(16).padStart(2, "0");
    })
    .join("");

export default function ModelField({ currentUrl, entered, onDimensions, parts, onParts }) {
  const [src, setSrc] = useState(currentUrl || "");
  const [fileName, setFileName] = useState("");
  const [dims, setDims] = useState(null);
  const [failed, setFailed] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");
  const [mats, setMats] = useState([]);
  const [highlight, setHighlight] = useState(false);
  const [editing, setEditing] = useState(false);
  const fileInput = useRef(null);
  const pendingParts = useRef(null);
  const viewer = useRef(null);
  const blob = useRef(null);
  const originals = useRef([]);

  useEffect(() => () => blob.current && URL.revokeObjectURL(blob.current), []);

  useEffect(() => {
    const el = viewer.current;
    if (!el) return;
    const onLoad = () => {
      const d = el.getDimensions?.();
      if (d) setDims({ w: Math.round(d.x * 100), h: Math.round(d.y * 100), d: Math.round(d.z * 100) });
      setFailed(false);
      const list = el.model?.materials || [];
      originals.current = list.map((m) => [...m.pbrMetallicRoughness.baseColorFactor]);
      setMats(list.map((m, i) => ({ i, hex: toSrgbHex(originals.current[i]) })));
      if (pendingParts.current) {
        onParts(pendingParts.current.parts);
        pendingParts.current = null;
      }
    };
    const onError = () => setFailed(true);
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    if (el.loaded) onLoad();
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [src, onParts]);

  const selected = (i) => !parts || parts.includes(i);

  useEffect(() => {
    const el = viewer.current;
    if (!el?.model || mats.length === 0) return;
    el.model.materials.forEach((m, i) => {
      const on = highlight && selected(i) && parts;
      m.pbrMetallicRoughness.setBaseColorFactor(on ? [1, 0.1, 0.5, 1] : originals.current[i]);
    });
  }, [highlight, parts, mats]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(i) {
    const all = mats.map((m) => m.i);
    const current = parts ? parts : all;
    const next = current.includes(i) ? current.filter((x) => x !== i) : [...current, i].sort((a, b) => a - b);
    if (next.length === 0) return;
    onParts(next.length === all.length ? null : next);
  }

  async function onPick(e) {
    const input = e.target;
    let file = input.files?.[0];
    if (blob.current) URL.revokeObjectURL(blob.current);
    setDims(null);
    setFailed(false);
    setConvertError("");
    setMats([]);
    setHighlight(false);
    onParts(null);
    if (!file) {
      blob.current = null;
      setFileName("");
      setSrc(currentUrl || "");
      return;
    }

    if (/\.(zip|obj)$/i.test(file.name)) {
      setConverting(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/convert", { method: "POST", body });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Aylantirib bo'lmadi");
        }
        const glb = new File([await res.blob()], file.name.replace(/\.(zip|obj)$/i, "") + ".glb", { type: "model/gltf-binary" });
        const dt = new DataTransfer();
        dt.items.add(glb);
        input.files = dt.files;
        file = glb;
      } catch (err) {
        setConvertError(err.message);
        input.value = "";
        setConverting(false);
        setSrc(currentUrl || "");
        return;
      }
      setConverting(false);
    }

    blob.current = URL.createObjectURL(file);
    setFileName(file.name);
    setSrc(blob.current);
  }

  function onEdited(file, editedParts) {
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.current.files = dt.files;
    if (blob.current) URL.revokeObjectURL(blob.current);
    blob.current = URL.createObjectURL(file);
    pendingParts.current = { parts: editedParts };
    setDims(null);
    setFailed(false);
    setMats([]);
    setHighlight(false);
    setFileName("tahrirlangan model");
    setSrc(blob.current);
    setEditing(false);
  }

  const mismatch =
    dims &&
    [["w", "width"], ["d", "depth"], ["h", "height"]].some(([k, f]) => {
      const v = parseInt(entered[f], 10);
      return v && Math.abs(v - dims[k]) / dims[k] > 0.15;
    });

  return (
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-3 hover:border-brand/60 transition-colors">
        <input
          ref={fileInput}
          type="file"
          name="glb"
          accept=".glb,.zip,.obj"
          onChange={onPick}
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand hover:file:bg-orange-100"
        />
        <p className="mt-2 text-xs text-slate-400">.glb fayl. Kiri Engine kabi ilovalarning OBJ (.zip) fayli ham bo&apos;ladi, u avtomatik .glb ga aylantiriladi.</p>
      </div>

      {converting && <p className="animate-pulse text-sm font-medium text-brand">OBJ ni GLB ga aylantiryapman, biroz kuting...</p>}
      {convertError && <p className="rounded-lg bg-red-50 text-red-600 text-sm px-3 py-2">{convertError}</p>}

      {src && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-linear-to-br from-orange-50 to-slate-50">
          <model-viewer suppressHydrationWarning
            key={src}
            ref={viewer}
            src={src}
            loading="eager"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            style={{ width: "100%", height: "280px" }}
          />
          <div className="px-4 py-3 text-sm border-t border-slate-200 bg-white space-y-2">
            <p className="text-slate-500 text-xs">{fileName ? `Yangi fayl: ${fileName}` : "Hozirgi model"}. Aylantirib tekshiring.</p>
            {!failed && (
              <div className="rounded-lg bg-orange-50 px-3 py-2 space-y-1.5">
                <button type="button" onClick={() => setEditing(true)} className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                  Modelni tahrirlash (bo&apos;yab belgilash)
                </button>
                <p className="text-xs text-slate-500 leading-snug">Modelni cho&apos;tka bilan bo&apos;yab, rangi o&apos;zgaradigan joyni belgilang yoki keraksiz joyni (pol, atrofdagi narsalar) o&apos;chiring.</p>
              </div>
            )}
            {failed && <p className="text-red-600 text-xs">Model ochilmadi. Fayl buzilgan bo&apos;lishi mumkin.</p>}
            {dims && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1">
                  Modeldan: {dims.w} x {dims.d} x {dims.h} sm
                </span>
                <button type="button" onClick={() => onDimensions({ width: dims.w, depth: dims.d, height: dims.h })} className="text-xs font-semibold text-brand hover:underline">
                  O&apos;lcham maydonlariga yozish
                </button>
              </div>
            )}
            {mismatch && (
              <p className="rounded-lg bg-amber-50 text-amber-800 text-xs px-3 py-2 leading-snug">
                Kiritilgan o&apos;lcham modeldan 15% dan ko&apos;p farq qiladi. AR&apos;da mebel noto&apos;g&apos;ri kattalikda ko&apos;rinadi. Skanerlashda masshtab noto&apos;g&apos;ri bo&apos;lgan bo&apos;lishi mumkin.
              </p>
            )}
          </div>
        </div>
      )}

      {mats.length > 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold">Rangi o&apos;zgaradigan qismlar</p>
            <p className="text-xs text-slate-500 mt-0.5">Belgilangan qismlar mijoz rang tanlaganda bo&apos;yaladi. Belgilanmaganlari (oyoq, dasta, korpus) asl rangida qoladi.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {mats.map((m) => (
              <button
                key={m.i}
                type="button"
                onClick={() => toggle(m.i)}
                aria-pressed={selected(m.i)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${selected(m.i) ? "border-brand bg-orange-50 text-brand" : "border-slate-200 text-slate-400"}`}
              >
                <span className="h-4 w-4 rounded-full border border-slate-300" style={{ background: m.hex }} />
                {selected(m.i) ? "O'zgaradi" : "Qoladi"} #{m.i + 1}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} className="accent-orange-600" disabled={!parts} />
            Tanlangan qismlarni modelda pushti rangda ko&apos;rsatish (tekshirish uchun)
          </label>
        </div>
      )}
      {editing && <ModelEditor src={src} onSave={onEdited} onClose={() => setEditing(false)} />}
    </div>
  );
}
