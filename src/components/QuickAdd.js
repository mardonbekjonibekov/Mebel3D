"use client";

import { useCart, toast } from "@/lib/store";

export default function QuickAdd({ id }) {
  const cart = useCart();

  return (
    <button
      type="button"
      aria-label="Savatchaga qo'shish"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        cart.add(id, 1);
        toast("Savatchaga qo'shildi");
      }}
      className="btn-primary h-9 w-9 shrink-0 grid place-items-center rounded-md!"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
