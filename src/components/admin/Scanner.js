"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const API = "/api/admin/photogrammetry";
const SECTORS = 24;
const MIN_PHOTOS = 20;
const RINGS = [
  { label: "1-aylana: ko'z darajasida", min: -28, max: 18, need: 21 },
  { label: "2-aylana: yuqoridan", min: -70, max: -24, need: 20 },
];
const MAX_TURN_SPEED = 40; // deg/s — faster turning blurs frames
const MIN_GAP_MS = 450;

// Direction the back camera points, from deviceorientation Euler angles (W3C Z-X'-Y'' order).
// Using the camera vector instead of raw alpha avoids gimbal jumps when the phone is held upright.
function cameraPose(e) {
  if (e.alpha == null || e.beta == null || e.gamma == null) return null;
  const r = Math.PI / 180;
  const [a, b, g] = [e.alpha * r, e.beta * r, e.gamma * r];
  const r13 = Math.cos(a) * Math.sin(g) + Math.sin(a) * Math.sin(b) * Math.cos(g);
  const r23 = Math.sin(a) * Math.sin(g) - Math.cos(a) * Math.sin(b) * Math.cos(g);
  const r33 = Math.cos(b) * Math.cos(g);
  const heading = ((Math.atan2(-r13, -r23) / r) + 360) % 360;
  const elevation = Math.asin(Math.max(-1, Math.min(1, -r33))) / r;
  return { heading, elevation };
}

const angleDiff = (a, b) => ((a - b + 540) % 360) - 180;

// Brightness and a Laplacian-variance sharpness score on a small grayscale copy of the frame.
function frameQuality(video, canvas) {
  const w = 160;
  const h = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * w));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const gray = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0; i < w * h; i++) {
    const v = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
    gray[i] = v;
    sum += v;
  }
  let lapSum = 0;
  let lapSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = gray[i - 1] + gray[i + 1] + gray[i - w] + gray[i + w] - 4 * gray[i];
      lapSum += lap;
      lapSq += lap * lap;
      n++;
    }
  }
  const mean = lapSum / n;
  return { brightness: sum / (w * h), sharpness: lapSq / n - mean * mean };
}

function arcPath(cx, cy, r, start, end) {
  const p = (deg) => [cx + r * Math.sin((deg * Math.PI) / 180), cy - r * Math.cos((deg * Math.PI) / 180)];
  const [x1, y1] = p(start);
  const [x2, y2] = p(end);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

function RingDial({ filled, ring, heading }) {
  const step = 360 / SECTORS;
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden="true">
      {[0, 1].map((ri) => {
        const r = ri === 0 ? 50 : 38;
        return Array.from({ length: SECTORS }, (_, s) => (
          <path
            key={`${ri}-${s}`}
            d={arcPath(60, 60, r, s * step + 1.5, (s + 1) * step - 1.5)}
            fill="none"
            strokeWidth={ri === ring ? 8 : 5}
            strokeLinecap="round"
            stroke={filled[ri].has(s) ? "#22c55e" : ri === ring ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)"}
          />
        ));
      })}
      {heading != null && (
        <circle cx={60 + (ring === 0 ? 50 : 38) * Math.sin((heading * Math.PI) / 180)} cy={60 - (ring === 0 ? 50 : 38) * Math.cos((heading * Math.PI) / 180)} r="5" fill="#fff" stroke="#111" strokeWidth="1.5" />
      )}
    </svg>
  );
}

export default function Scanner({ product }) {
  const router = useRouter();
  const [jobStarted, setJobStarted] = useState(false);
  const [phase, setPhase] = useState("intro"); // intro | scanning | uploading | processing | done | error
  const [height, setHeight] = useState(product.height ? String(product.height) : "");
  const [error, setError] = useState("");
  const [manual, setManual] = useState(false);
  const [ring, setRing] = useState(0);
  const [filled, setFilled] = useState([new Set(), new Set()]);
  const [heading, setHeading] = useState(null);
  const [hint, setHint] = useState("");
  const [captured, setCaptured] = useState(0);
  const [uploaded, setUploaded] = useState(0);
  const [progress, setProgress] = useState(0);
  const [flash, setFlash] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const jobRef = useRef(null);
  const pose = useRef(null);
  const startHeading = useRef(null);
  const speed = useRef(0);
  const lastPose = useRef(null);
  const lastShot = useRef(0);
  const sharpHistory = useRef([]);
  const filledRef = useRef([new Set(), new Set()]);
  const ringRef = useRef(0);
  const pauseUntil = useRef(0);
  const queue = useRef([]);
  const uploading = useRef(0);
  const encoding = useRef(0);
  const capturedRef = useRef(0);
  const uploadedRef = useRef(0);
  const qualityCanvas = useRef(null);
  const wakeLock = useRef(null);
  const alive = useRef(true);
  const orientHandler = useRef(null);
  const lastTick = useRef(0);

  useEffect(() => () => {
    alive.current = false;
  }, []);

  const stopDevices = useCallback(() => {
    if (orientHandler.current) window.removeEventListener("deviceorientation", orientHandler.current);
    orientHandler.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    wakeLock.current?.release?.().catch(() => {});
    wakeLock.current = null;
  }, []);

  useEffect(() => stopDevices, [stopDevices]);

  const pump = useCallback(() => {
    while (uploading.current < 2 && queue.current.length) {
      uploading.current++;
      (async () => {
        while (queue.current.length) {
          const item = queue.current.shift();
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const body = new FormData();
              body.append("file", item, `scan_${Date.now()}.jpg`);
              const res = await fetch(`${API}/${jobRef.current}/images`, { method: "POST", body });
              if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Yuklab bo'lmadi");
              uploadedRef.current++;
              if (alive.current) setUploaded(uploadedRef.current);
              break;
            } catch (err) {
              if (attempt === 2) {
                if (alive.current) setHint("Internet sust — ba'zi suratlar yuklanmadi.");
                console.error(err);
              } else await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
            }
          }
        }
        uploading.current--;
      })();
    }
  }, []);

  const shoot = useCallback(() => {
    const v = videoRef.current;
    if (!v?.videoWidth) return false;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d").drawImage(v, 0, 0);
    encoding.current++;
    canvas.toBlob((blob) => {
      encoding.current--;
      if (!blob) return;
      queue.current.push(blob);
      pump();
    }, "image/jpeg", 0.92);
    capturedRef.current++;
    setCaptured(capturedRef.current);
    lastShot.current = performance.now();
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
    navigator.vibrate?.(25);
    return true;
  }, [pump]);

  const finish = useCallback(async () => {
    setPhase("uploading");
    stopDevices();
    while (encoding.current || queue.current.length || uploading.current) await new Promise((r) => setTimeout(r, 300));
    if (!alive.current) return;
    if (uploadedRef.current < MIN_PHOTOS) {
      setError(`Faqat ${uploadedRef.current} ta surat yuklandi, kamida ${MIN_PHOTOS} ta kerak. Internetni tekshirib, qaytadan skanerlang.`);
      setPhase("error");
      return;
    }
    try {
      const res = await fetch(`${API}/${jobRef.current}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heightCm: Number(height) || null, detail: "reduced" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Boshlab bo'lmadi");
      setPhase("processing");
      while (alive.current) {
        await new Promise((r) => setTimeout(r, 2500));
        const s = await fetch(`${API}/${jobRef.current}`).then((r) => r.json());
        if (!alive.current) return;
        setProgress(s.progress || 0);
        if (s.status === "error") throw new Error(s.error);
        if (s.status === "done") {
          setPhase("done");
          return;
        }
      }
    } catch (err) {
      if (!alive.current) return;
      setError(err.message);
      setPhase("error");
    }
  }, [height, stopDevices]);

  // Auto-capture loop: shoot when the phone faces a not-yet-covered sector, at the right height, steadily.
  useEffect(() => {
    if (phase !== "scanning" || manual) return;
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      if (now - lastTick.current < 100) return;
      lastTick.current = now;
      const p = pose.current;
      if (!p || now - p.t > 800) return;
      if (startHeading.current == null) startHeading.current = p.heading;
      const rel = (p.heading - startHeading.current + 360) % 360;
      setHeading(rel);
      if (now < pauseUntil.current) return;

      const cfg = RINGS[ringRef.current];
      if (p.elevation > cfg.max) return setHint(ringRef.current === 0 ? "Telefonni biroz pastga, mebelga qarating" : "Telefonni yuqoriroq ko'tarib, mebelga pastga qarating");
      if (p.elevation < cfg.min) return setHint(ringRef.current === 0 ? "Telefonni tikroq tuting, mebelga to'g'ri qarating" : "Juda tepadan — biroz pastroq tushiring");
      if (speed.current > MAX_TURN_SPEED) return setHint("Sekinroq yuring");

      const sector = Math.floor(rel / (360 / SECTORS)) % SECTORS;
      const set = filledRef.current[ringRef.current];
      if (set.has(sector)) return setHint("Mebel atrofida sekin aylanib yuring");
      if (now - lastShot.current < MIN_GAP_MS) return;

      const q = frameQuality(videoRef.current, (qualityCanvas.current ??= document.createElement("canvas")));
      if (q.brightness < 45) return setHint("Juda qorong'i — chiroqni yoqing yoki yorug'roq joyga o'ting");
      const hist = sharpHistory.current;
      const median = hist.length ? [...hist].sort((x, y) => x - y)[Math.floor(hist.length / 2)] : 0;
      if (hist.length >= 3 && q.sharpness < median * 0.45) return setHint("Surat xira — telefonni qimirlatmang");

      if (!shoot()) return;
      hist.push(q.sharpness);
      if (hist.length > 15) hist.shift();
      set.add(sector);
      setFilled([new Set(filledRef.current[0]), new Set(filledRef.current[1])]);
      setHint("Zo'r, davom eting");

      if (set.size >= cfg.need) {
        if (ringRef.current === 0) {
          ringRef.current = 1;
          setRing(1);
          startHeading.current = null;
          pauseUntil.current = now + 2500;
          setHint("Birinchi aylana tayyor! Endi telefonni yuqoriroq ko'tarib, mebelga pastga qaratib yana bir aylaning");
        } else {
          finish();
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, manual, shoot, finish]);

  async function start() {
    setError("");
    let sensorsAllowed = true;
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      try {
        sensorsAllowed = (await DeviceOrientationEvent.requestPermission()) === "granted";
      } catch {
        sensorsAllowed = false;
      }
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      setError("Bu brauzerda kamerani ochib bo'lmadi. Saytni https orqali, Chrome yoki Safari'da oching.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 3840 }, height: { ideal: 2160 } },
        audio: false,
      });
      streamRef.current = stream;
      const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
      const job = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(job.error || "Skanerlashni boshlab bo'lmadi");
      jobRef.current = job.id;
      setJobStarted(true);
    } catch (err) {
      stopDevices();
      setError(err.name === "NotAllowedError" ? "Kameraga ruxsat berilmadi. Brauzer sozlamalarida ruxsat bering." : err.message);
      return;
    }

    wakeLock.current = await navigator.wakeLock?.request("screen").catch(() => null);
    setPhase("scanning");
    setHint("Mebelni ramka ichida tuting va atrofida sekin yuring");

    if (!sensorsAllowed) {
      setManual(true);
      return;
    }
    let got = false;
    const onOrient = (e) => {
      const p = cameraPose(e);
      if (!p) return;
      got = true;
      const now = performance.now();
      const prev = lastPose.current;
      if (prev) {
        const dt = (now - prev.t) / 1000;
        if (dt > 0) speed.current = speed.current * 0.7 + (Math.abs(angleDiff(p.heading, prev.heading)) / dt) * 0.3;
      }
      lastPose.current = { ...p, t: now };
      pose.current = { ...p, t: now };
    };
    orientHandler.current = onOrient;
    window.addEventListener("deviceorientation", onOrient);
    setTimeout(() => {
      if (!got && alive.current) setManual(true);
    }, 2000);
  }

  useEffect(() => {
    if (phase === "scanning" && videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  async function cancel() {
    alive.current = false;
    stopDevices();
    if (jobRef.current) await fetch(`${API}/${jobRef.current}`, { method: "DELETE" }).catch(() => {});
    router.push(`/admin/products/${product.id}`);
  }

  const back = `/admin/products/${product.id}`;

  if (phase === "intro" || (phase === "error" && !jobStarted)) {
    return (
      <div className="mx-auto max-w-md">
        <Link href={back} className="text-sm text-slate-500 hover:text-ink">&larr; Mahsulotga qaytish</Link>
        <h1 className="mt-3 text-2xl font-extrabold">3D skanerlash</h1>
        <p className="mt-1 text-sm text-slate-500">{product.name}</p>

        <ol className="mt-6 space-y-3">
          {[
            ["Mebelni yorug' joyga qo'ying", "Atrofida bemalol aylanib yurishga joy bo'lsin."],
            ["Telefonni mebelga qaratib, atrofida sekin yuring", "Suratlar o'zi olinadi, pastdagi aylana yashil bo'lib to'ladi."],
            ["Keyin yuqoriroqdan yana bir aylaning", "Ekrandagi ko'rsatmaga amal qilsangiz yetarli. Hammasi 1–2 daqiqa."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <span>
                <span className="block text-sm font-semibold">{t}</span>
                <span className="block text-xs text-slate-500">{d}</span>
              </span>
            </li>
          ))}
        </ol>

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Mebelning haqiqiy balandligi (sm)</span>
          <input type="number" min="1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="masalan 85" className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-ink" />
          <span className="mt-1 block text-xs text-slate-400">Telefonda mebel to&apos;g&apos;ri kattalikda ko&apos;rinishi uchun.</span>
        </label>

        {product.glbUrl && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Bu mahsulotda 3D model bor. Yangi skaner tayyor bo&apos;lganda eskisining o&apos;rniga qo&apos;yiladi.</p>}
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button type="button" onClick={start} className="btn-primary mt-6 w-full py-3.5 text-base">Boshlash</button>
      </div>
    );
  }

  if (phase === "scanning") {
    const cfg = RINGS[ring];
    const canFinish = captured >= MIN_PHOTOS;
    return (
      <div className="fixed inset-0 z-200 flex flex-col bg-black text-white">
        <div className="relative flex-1 overflow-hidden">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <div className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ${flash ? "opacity-40" : "opacity-0"}`} />
          <div className="pointer-events-none absolute inset-x-[12%] inset-y-[18%] rounded-3xl border-2 border-dashed border-white/50" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-linear-to-b from-black/70 to-transparent px-4 pb-8 pt-[calc(0.75rem+env(safe-area-inset-top))]">
            <button type="button" onClick={cancel} className="rounded-full bg-black/50 px-4 py-2 text-sm font-medium backdrop-blur">Bekor qilish</button>
            <span className="rounded-full bg-black/50 px-3 py-1.5 text-sm font-semibold backdrop-blur">{captured} surat · {uploaded} yuborildi</span>
          </div>
        </div>

        <div className="bg-black px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          <p className="min-h-10 text-center text-sm font-medium leading-snug">{manual ? "Mebel atrofida yurib, har qadamda pastdagi tugmani bosing" : hint}</p>
          <div className="mt-2 flex items-center justify-between">
            {manual ? (
              <span className="w-28 text-xs text-white/60">{captured}/{MIN_PHOTOS * 2} surat</span>
            ) : (
              <div className="flex w-28 flex-col items-center">
                <RingDial filled={filled} ring={ring} heading={heading} />
                <span className="text-[10px] text-white/60">{cfg.label}</span>
              </div>
            )}
            <button type="button" onClick={() => shoot()} aria-label="Qo'lda suratga olish" className={`grid place-items-center rounded-full border-4 border-white ${manual ? "h-20 w-20" : "h-14 w-14 opacity-70"}`}>
              <span className={`rounded-full bg-white ${manual ? "h-15 w-15" : "h-10 w-10"}`} />
            </button>
            <button type="button" onClick={finish} disabled={!canFinish} className="w-28 rounded-full bg-white px-3 py-2.5 text-sm font-semibold text-black disabled:opacity-30">
              Tugatish
            </button>
          </div>
          {!canFinish && <p className="mt-2 text-center text-[11px] text-white/50">Tugatish uchun kamida {MIN_PHOTOS} ta surat kerak</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md text-center">
      {phase === "uploading" && (
        <>
          <h1 className="text-xl font-extrabold">Suratlar yuborilmoqda</h1>
          <p className="mt-2 text-sm text-slate-500">{uploaded} / {captured}</p>
          <Progress value={captured ? uploaded / captured : 0} />
        </>
      )}
      {phase === "processing" && (
        <>
          <h1 className="text-xl font-extrabold">3D model yasalmoqda</h1>
          <Progress value={progress} />
          <p className="mt-2 text-sm font-semibold">{Math.round(progress * 100)}%</p>
          <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600">Odatda 1–5 daqiqa. Sahifani yopsangiz ham bo&apos;ladi — model tayyor bo&apos;lganda mahsulotga o&apos;zi qo&apos;yiladi va Telegram&apos;ga xabar keladi.</p>
        </>
      )}
      {phase === "done" && (
        <>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
          <h1 className="mt-4 text-xl font-extrabold">3D model tayyor!</h1>
          <p className="mt-2 text-sm text-slate-500">Model «{product.name}» mahsulotiga qo&apos;yildi.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href={back} className="btn-primary py-3">Mahsulotni ochish</Link>
            <Link href={`/product/${product.id}`} target="_blank" className="rounded-full border border-slate-300 bg-white py-3 font-medium">Saytda ko&apos;rish</Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">Ortiqcha pol yoki atrofdagi narsalar chiqib qolgan bo&apos;lsa, mahsulot sahifasida &laquo;Modelni tahrirlash&raquo; orqali olib tashlang.</p>
        </>
      )}
      {phase === "error" && (
        <>
          <h1 className="text-xl font-extrabold text-red-600">Model yasab bo&apos;lmadi</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <div className="mt-6 flex flex-col gap-2">
            <button type="button" onClick={() => window.location.reload()} className="btn-primary py-3">Qaytadan skanerlash</button>
            <Link href={back} className="rounded-full border border-slate-300 bg-white py-3 font-medium">Mahsulotga qaytish</Link>
          </div>
        </>
      )}
    </div>
  );
}

function Progress({ value }) {
  return (
    <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
