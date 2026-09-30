"use client";

import { useState } from "react";
import Link from "next/link";

function VideoCard({ item }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="group relative aspect-4/5 overflow-hidden rounded-md bg-[#ede9f0]">
      {playing ? (
        <video src={item.videoUrl} controls autoPlay playsInline className="h-full w-full object-cover" />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`${item.name} videosini ko'rish`} className="block h-full w-full cursor-pointer">
          {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />}
          <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/5 to-transparent" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition-transform group-hover:scale-110">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </span>
          <span className="absolute inset-x-0 bottom-0 p-3.5 text-left text-sm font-medium text-white">{item.name}</span>
        </button>
      )}
    </div>
  );
}

export default function WorkshopVideos({ items }) {
  return (
    <div>
      <p className="eyebrow">Ishlarimiz</p>
      <div className="flex items-end justify-between gap-4">
        <h2 className="mt-2 text-3xl leading-none md:text-5xl">Mebel qanday tayyorlanadi</h2>
        <Link href="/catalog" className="hidden shrink-0 border-b border-ink pb-0.5 text-sm font-medium text-ink sm:inline-block">Katalogga o&apos;tish</Link>
      </div>
      <div className="no-scrollbar -mx-4 mt-8 flex snap-x scroll-pl-4 gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
        {items.map((item, i) => (
          <div key={item.id} className="w-48 shrink-0 snap-start md:w-auto" style={{ animation: `fade-up .5s ${i * 70}ms both` }}>
            <VideoCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
