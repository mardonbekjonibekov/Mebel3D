"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ url, label = "O'chirish", confirmText = "O'chirmoqchimisiz?", redirectTo }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm(confirmText)) return;
    setLoading(true);
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "O'chirib bo'lmadi");
    }
    if (res.ok && redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <button type="button" onClick={onClick} disabled={loading} className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50">
      {loading ? "..." : label}
    </button>
  );
}
