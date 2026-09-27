"use client";

import { useEffect, useRef } from "react";

export const MAX_IMAGES = 8;

export default function ImagesField({ items, setItems }) {
  const input = useRef(null);
  const previews = useRef(new Set());

  useEffect(() => {
    const set = previews.current;
    return () => set.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function addFiles(list) {
    const room = MAX_IMAGES - items.length;
    const added = [...list].slice(0, Math.max(0, room)).map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { id: `${file.name}-${file.size}-${Math.random()}`, file, preview };
    });
    if (added.length) setItems([...items, ...added]);
    if (input.current) input.current.value = "";
  }

  const makeCover = (i) => setItems([items[i], ...items.filter((_, k) => k !== i)]);
  const remove = (i) => setItems(items.filter((_, k) => k !== i));

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-slate-700">Rasmlar</span>
        <span className="text-xs text-slate-400">{items.length} / {MAX_IMAGES} (majburiy emas, bitta yetarli)</span>
      </div>
      <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {items.map((it, i) => (
          <div key={it.id || it.url} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img src={it.preview || it.url} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">Asosiy</span>}
            <button type="button" onClick={() => remove(i)} aria-label="Rasmni o'chirish" className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white text-lg leading-none hover:bg-red-600">
              &times;
            </button>
            {i !== 0 && (
              <button type="button" onClick={() => makeCover(i)} className="absolute inset-x-0 bottom-0 bg-black/60 py-1.5 text-[11px] font-semibold text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                Asosiy qilish
              </button>
            )}
          </div>
        ))}
        {items.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand hover:text-brand transition-colors grid place-items-center text-center px-2"
          >
            <span>
              <span className="block text-2xl leading-none">+</span>
              <span className="text-[11px] font-semibold">Rasm qo&apos;shish</span>
            </span>
          </button>
        )}
      </div>
      <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(e) => addFiles(e.target.files)} className="hidden" />
      <p className="mt-1.5 text-xs text-slate-400">Mebelni har xil burchakdan ko&apos;rsating. Birinchi rasm katalogda ko&apos;rinadi. Katta rasmlar avtomatik kichraytiriladi.</p>
    </div>
  );
}
