"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const OPTIONS = [
  ["new", "Yangilari"],
  ["price_asc", "Arzonroq"],
  ["price_desc", "Qimmatroq"],
];

export default function SortSelect({ value }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(e) {
    const next = new URLSearchParams(params.toString());
    if (e.target.value === "new") next.delete("sort");
    else next.set("sort", e.target.value);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <select
      value={value}
      onChange={onChange}
      aria-label="Saralash"
      className="h-10 rounded-md border border-line bg-white px-3 text-sm font-medium outline-none focus:border-ink"
    >
      {OPTIONS.map(([v, label]) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}
