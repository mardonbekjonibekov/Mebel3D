"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export const TONES = {
  orange: "from-[#2b2016] to-[#5b4127]",
  dark: "from-[#141311] to-[#2f2c28]",
  blue: "from-[#1c2733] to-[#3a4d61]",
  green: "from-[#1d2a22] to-[#3d5445]",
  rose: "from-[#2f1a18] to-[#6a3a33]",
};

const AUTOPLAY_MS = 6000;

export default function BannerSlider({ banners }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef(null);
  const n = banners.length;

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [n, paused]);

  const go = (d) => setI((x) => (x + d + n) % n);

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        setPaused(false);
      }}
    >
      <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]" style={{ transform: `translateX(-${i * 100}%)` }}>
        {banners.map((b) => (
          <div key={b.id} className={`relative h-56 min-w-full bg-linear-to-br sm:h-72 md:h-96 ${TONES[b.tone] || TONES.orange}`}>
            {b.imageUrl && <img src={b.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            {b.imageUrl && <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-transparent" />}
            <div className="relative flex h-full max-w-3xl flex-col justify-center px-6 text-white md:pl-20 md:pr-12">
              <h2 className="text-[1.75rem] leading-[1.1] sm:text-4xl md:text-6xl">{b.title}</h2>
              {b.subtitle && <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/80 sm:text-sm md:mt-4 md:text-base">{b.subtitle}</p>}
              {b.link && (
                <Link href={b.link} className="mt-5 inline-flex w-fit items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-[#efe9df] md:mt-7">
                  {b.buttonText || "Batafsil"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Oldingi" className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-md border border-white/25 bg-black/20 text-white backdrop-blur transition hover:bg-white hover:text-ink md:grid">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Keyingi" className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-md border border-white/25 bg-black/20 text-white backdrop-blur transition hover:bg-white hover:text-ink md:grid">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="absolute bottom-4 left-6 flex gap-2 md:left-20">
            {banners.map((b, k) => (
              <button key={b.id} type="button" onClick={() => setI(k)} aria-label={`Banner ${k + 1}`} className={`relative h-0.5 overflow-hidden bg-white/35 transition-all ${k === i ? "w-12" : "w-6 hover:bg-white/60"}`}>
                {k === i && <span key={`${i}-${paused}`} className="absolute inset-y-0 left-0 bg-white" style={{ animation: `banner-fill ${AUTOPLAY_MS}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
