"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const input = "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-ink focus:ring-1 focus:ring-ink";

export default function CategoryManager({ categories }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(url, method, body) {
    setBusy(true);
    setError("");
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Xatolik yuz berdi");
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold">
          Kategoriyalar <span className="text-slate-400 text-lg font-semibold">{categories.length}</span>
        </h1>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="btn-primary px-5 py-2.5 text-sm">
            + Kategoriya qo&apos;shish
          </button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await call("/api/admin/categories", "POST", { name })) {
              setName("");
              setAdding(false);
            }
          }}
          className="animate-fade-up flex gap-2 rounded-2xl bg-white border border-slate-200 p-3"
        >
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Oshxona mebeli" maxLength={40} className={`${input} flex-1 min-w-0`} />
          <button type="submit" disabled={busy} className="btn-primary px-5 text-sm disabled:opacity-60">Qo&apos;shish</button>
          <button type="button" onClick={() => { setAdding(false); setError(""); }} className="rounded-full border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50">Bekor</button>
        </form>
      )}

      {error && <p className="rounded-xl bg-red-50 text-red-600 text-sm px-4 py-3">{error}</p>}

      <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100">
        {categories.length === 0 && <p className="p-8 text-center text-sm text-slate-400">Hali kategoriya yo&apos;q</p>}
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3.5 md:p-4">
            {editing === c.id ? (
              <form
                className="flex flex-1 gap-2 min-w-0"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await call(`/api/admin/categories/${c.id}`, "PATCH", { name: editName })) setEditing(null);
                }}
              >
                <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={40} className={`${input} flex-1 min-w-0 py-2`} />
                <button type="submit" disabled={busy} className="text-sm font-semibold text-brand">Saqlash</button>
                <button type="button" onClick={() => setEditing(null)} className="text-sm text-slate-500">Bekor</button>
              </form>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.count} ta mahsulot · /catalog/{c.slug}</p>
                </div>
                <button type="button" onClick={() => { setEditing(c.id); setEditName(c.name); setError(""); }} className="text-sm font-semibold text-brand hover:underline">Nomini o&apos;zgartirish</button>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`"${c.name}" kategoriyasi o'chirilsinmi?`)) await call(`/api/admin/categories/${c.id}`, "DELETE");
                  }}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  O&apos;chirish
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
