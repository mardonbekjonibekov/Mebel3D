import InfoPage from "@/components/InfoPage";
import { getPages } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Savol-javob" };

export default async function FaqPage() {
  const pages = await getPages();
  return (
    <InfoPage title="Savol-javob" current="/faq">
      <div className="space-y-3">
        {pages.faq.map((f) => (
          <details key={f.q} className="group rounded-lg border border-line bg-white open:border-ink/30 transition-colors">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-semibold">
              {f.q}
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-50 text-brand transition-transform group-open:rotate-45">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
              </span>
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-neutral-600 whitespace-pre-line">{f.a}</p>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
