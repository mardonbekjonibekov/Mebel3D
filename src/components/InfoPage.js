import Link from "next/link";

const LINKS = [
  ["/about", "Biz haqimizda"],
  ["/delivery", "Yetkazib berish va to'lov"],
  ["/warranty", "Kafolat va qaytarish"],
  ["/faq", "Savol-javob"],
  ["/contacts", "Aloqa"],
];

export default function InfoPage({ title, current, children }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <nav className="mb-2 flex gap-1.5 text-xs text-neutral-400">
        <Link href="/" className="hover:text-brand">Bosh sahifa</Link>/<span className="text-neutral-600">{title}</span>
      </nav>
      <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
        <aside className="rounded-2xl border border-neutral-200 bg-white p-2 lg:sticky lg:top-24">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={`block rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${current === href ? "bg-[#efebe4] font-medium text-ink" : "text-neutral-700 hover:bg-neutral-50"}`}>
              {label}
            </Link>
          ))}
        </aside>
        <div className="animate-fade-up rounded-2xl border border-neutral-200 bg-white p-5 md:p-8" style={{ animationDuration: "0.4s" }}>{children}</div>
      </div>
    </div>
  );
}

export function TextBlock({ text }) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-neutral-700">
      {String(text).split(/\n\s*\n/).map((para, i) => (
        <p key={i} className="whitespace-pre-line">{para}</p>
      ))}
    </div>
  );
}
