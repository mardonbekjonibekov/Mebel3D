"use client";

import { useEffect, useRef, useState } from "react";

const MIN = 20;
const API = "/api/admin/photogrammetry";

async function call(url, init) {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Xatolik yuz berdi");
  return data;
}

export default function PhotoTo3D({ defaultHeight, onModel }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [heightInput, setHeight] = useState(null);
  const height = heightInput ?? (defaultHeight ? String(defaultHeight) : "");
  const [detail, setDetail] = useState("reduced");
  const [phase, setPhase] = useState("idle"); // idle | uploading | processing | done | error
  const [uploaded, setUploaded] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const jobId = useRef(null);
  const stopped = useRef(false);

  useEffect(() => () => {
    stopped.current = true;
  }, []);

  const busy = phase === "uploading" || phase === "processing";

  function pick(e) {
    const list = [...(e.target.files || [])].filter((f) => /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name));
    setFiles(list);
    setError("");
    setPhase("idle");
  }

  async function run() {
    setError("");
    stopped.current = false;
    try {
      setPhase("uploading");
      setUploaded(0);
      const job = await call(API, { method: "POST" });
      jobId.current = job.id;
      for (let i = 0; i < files.length; i++) {
        if (stopped.current) return;
        const body = new FormData();
        body.append("file", files[i]);
        await call(`${API}/${job.id}/images`, { method: "POST", body });
        setUploaded(i + 1);
      }

      setPhase("processing");
      setProgress(0);
      await call(`${API}/${job.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heightCm: Number(height) || null, detail }),
      });

      while (!stopped.current) {
        await new Promise((r) => setTimeout(r, 2000));
        const s = await call(`${API}/${job.id}`);
        setProgress(s.progress);
        if (s.status === "error") throw new Error(s.error);
        if (s.status === "done") break;
      }
      if (stopped.current) return;

      const res = await fetch(`${API}/${job.id}/model`);
      if (!res.ok) throw new Error("Tayyor modelni yuklab bo'lmadi");
      const file = new File([await res.blob()], "rasmlardan-model.glb", { type: "model/gltf-binary" });
      onModel(file);
      setPhase("done");
      fetch(`${API}/${job.id}`, { method: "DELETE" }).catch(() => {});
      jobId.current = null;
    } catch (err) {
      setError(err.message);
      setPhase("error");
    }
  }

  async function cancel() {
    stopped.current = true;
    if (jobId.current) await fetch(`${API}/${jobId.current}`, { method: "DELETE" }).catch(() => {});
    jobId.current = null;
    setPhase("idle");
  }

  const pct = Math.round(progress * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span>
          <span className="block text-sm font-semibold text-slate-800">Rasmlardan 3D model yaratish</span>
          <span className="block text-xs text-slate-500">Mebelni 20+ burchakdan suratga oling — model avtomatik yasaladi.</span>
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-200 px-4 pb-4 pt-3">
          <ul className="space-y-1 text-xs leading-relaxed text-slate-600">
            <li>• Mebel atrofida aylanib, har qadamda bittadan surat oling: 20–80 ta rasm.</li>
            <li>• 2–3 xil balandlikdan: past, ko&apos;z darajasida va biroz yuqoridan.</li>
            <li>• Har bir rasm oldingisi bilan kamida yarmi ustma-ust tushsin.</li>
            <li>• Yorug&apos; joyda, mebel harakatlanmasin, butun mebel kadrda tursin.</li>
            <li>• Yaltiroq, shaffof yoki butunlay bir rangli sirtlar yomonroq chiqadi.</li>
          </ul>

          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-3">
            <input type="file" multiple accept="image/jpeg,image/png,image/heic,.heic,.heif" onChange={pick} disabled={busy} className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand hover:file:bg-orange-100" />
            <p className={`mt-2 text-xs ${files.length && files.length < MIN ? "text-red-600" : "text-slate-500"}`}>
              {files.length === 0 ? "Rasmlarni birdaniga belgilab tanlang." : `${files.length} ta rasm tanlandi${files.length < MIN ? ` — kamida ${MIN} ta kerak` : ""}.`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Mebelning haqiqiy balandligi (sm)</span>
              <input type="number" min="1" value={height} onChange={(e) => setHeight(e.target.value)} disabled={busy} placeholder="masalan 85" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-ink" />
              <span className="mt-1 block text-[11px] text-slate-400">AR&apos;da to&apos;g&apos;ri o&apos;lchamda ko&apos;rinishi uchun kerak.</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Sifat</span>
              <select value={detail} onChange={(e) => setDetail(e.target.value)} disabled={busy} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-ink">
                <option value="reduced">Sayt uchun (tez, yengil)</option>
                <option value="medium">Yuqori sifat (sekinroq, og&apos;irroq)</option>
              </select>
            </label>
          </div>

          {phase === "uploading" && <Bar label={`Rasmlar yuklanmoqda: ${uploaded}/${files.length}`} value={files.length ? uploaded / files.length : 0} />}
          {phase === "processing" && <Bar label={pct < 97 ? `3D model yasalmoqda: ${pct}%` : "Yakunlanmoqda..."} value={progress} />}
          {phase === "processing" && <p className="text-[11px] text-slate-500">Odatda 1–5 daqiqa oladi. Sahifani yopmang.</p>}
          {phase === "done" && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">Model tayyor va yuqoriga qo&apos;yildi. Aylantirib tekshiring, ortiqcha pol qolgan bo&apos;lsa &laquo;Modelni tahrirlash&raquo; orqali olib tashlang, so&apos;ng Saqlang.</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={run} disabled={busy || files.length < MIN} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
              {phase === "done" || phase === "error" ? "Qaytadan yaratish" : "3D model yaratish"}
            </button>
            {busy && (
              <button type="button" onClick={cancel} className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium hover:bg-slate-50">Bekor qilish</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Bar({ label, value }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate-700">{label}</p>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}
