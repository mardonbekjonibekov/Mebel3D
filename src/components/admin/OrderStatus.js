"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/orderStatus";

export default function OrderStatus({ id, status }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function change(next) {
    setValue(next);
    setSaving(true);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={value}
      onChange={(e) => change(e.target.value)}
      disabled={saving}
      className={`rounded-full px-3 py-1.5 text-xs font-bold outline-none cursor-pointer ${STATUS_STYLES[value]}`}
    >
      {Object.entries(STATUS_LABELS).map(([k, l]) => (
        <option key={k} value={k}>{l}</option>
      ))}
    </select>
  );
}
