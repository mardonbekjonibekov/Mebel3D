"use client";

import { useEffect, useState } from "react";

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function onToast(e) {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-2), { id, text: e.detail }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
    }
    window.addEventListener("m3d-toast", onToast);
    return () => window.removeEventListener("m3d-toast", onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 md:bottom-8 z-70 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-slide-up pointer-events-auto rounded-md bg-ink text-white text-sm font-medium px-5 py-3 shadow-[0_20px_40px_-16px_rgba(23,22,20,0.5)] flex items-center gap-2"
        >
          <span className="h-2 w-2 rounded-full bg-brand-light" />
          {t.text}
        </div>
      ))}
    </div>
  );
}
