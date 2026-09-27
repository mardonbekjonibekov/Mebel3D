"use client";

import Link from "next/link";
import { useState } from "react";

export default function ProductTabs({ specs, delivery, warranty }) {
  const tabs = [
    { key: "specs", label: "Xususiyatlari" },
    { key: "delivery", label: "Yetkazib berish va to'lov" },
    { key: "warranty", label: "Kafolat" },
  ];
  const [tab, setTab] = useState("specs");

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white">
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-neutral-100 px-3 pt-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${tab === t.key ? "border-brand text-brand" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={tab} className="animate-fade-in p-4 md:p-6 text-sm" style={{ animationDuration: "0.3s" }}>
        {tab === "specs" &&
          (specs.length ? (
            <dl className="divide-y divide-neutral-100">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3">
                  <dt className="text-neutral-500">{k}</dt>
                  <dd className="font-semibold text-right">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-neutral-400">Ma&apos;lumot kiritilmagan.</p>
          ))}
        {tab === "delivery" && (
          <div>
            <p className="whitespace-pre-line leading-relaxed text-neutral-700">{delivery}</p>
            <Link href="/delivery" className="mt-3 inline-block font-semibold text-brand hover:underline">Batafsil</Link>
          </div>
        )}
        {tab === "warranty" && (
          <div>
            <p className="whitespace-pre-line leading-relaxed text-neutral-700">{warranty}</p>
            <Link href="/warranty" className="mt-3 inline-block font-semibold text-brand hover:underline">Batafsil</Link>
          </div>
        )}
      </div>
    </div>
  );
}
