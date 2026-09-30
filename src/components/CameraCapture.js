"use client";

import { useEffect, useRef, useState } from "react";

export function canUseLiveCamera() {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && window.isSecureContext;
}

export default function CameraCapture({ onCapture, onClose, onUnavailable }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState("environment");

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const v = videoRef.current;
        v.srcObject = stream;
        v.play().then(() => setReady(true)).catch(() => setReady(true));
      })
      .catch(() => {
        if (!cancelled) onUnavailable();
      });
    return () => {
      cancelled = true;
      setReady(false);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing, onUnavailable]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function shoot() {
    const v = videoRef.current;
    if (!v?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d").drawImage(v, 0, 0);
    canvas.toBlob((blob) => blob && onCapture(URL.createObjectURL(blob)), "image/jpeg", 0.9);
  }

  return (
    <div className="fixed inset-0 z-100 flex flex-col bg-black" role="dialog" aria-label="Kamera">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        {!ready && <p className="absolute inset-0 grid place-items-center text-sm text-white/70">Kamera ochilmoqda...</p>}
        <button type="button" onClick={onClose} aria-label="Yopish" className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div className="flex items-center justify-between bg-black px-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
        <span className="w-11" />
        <button type="button" onClick={shoot} disabled={!ready} aria-label="Suratga olish" className="grid h-18 w-18 place-items-center rounded-full border-4 border-white disabled:opacity-40">
          <span className="h-14 w-14 rounded-full bg-white" />
        </button>
        <button type="button" onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))} aria-label="Kamerani almashtirish" className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 8h3l2-3h6l2 3h3v11H4V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9.5 13a2.5 2.5 0 014.3-1.8M14.5 13a2.5 2.5 0 01-4.3 1.8M14 10v1.5h-1.5M10 16v-1.5h1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  );
}
