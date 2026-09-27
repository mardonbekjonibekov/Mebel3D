"use client";

import { toast } from "@/lib/store";

export default function CopyOrder({ text }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast("Buyurtma nusxalandi");
        } catch {
          toast("Nusxalab bo'lmadi");
        }
      }}
      className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 active:scale-95 transition"
    >
      Nusxalash
    </button>
  );
}
