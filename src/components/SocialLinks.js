const ICONS = {
  telegram: "M21 4L3 11l6 2 2 6 3-4 5 4 2-15z",
  instagram: "M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm5 5a4 4 0 100 8 4 4 0 000-8zm5.5-1.5h.01",
  facebook: "M14 8h3V4h-3a4 4 0 00-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z",
  youtube: "M3 8a3 3 0 013-3h12a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V8zm7 1.5v5l4.5-2.5L10 9.5z",
};

export default function SocialLinks({ site, className = "", size = 16, tone = "light" }) {
  const items = [["telegram", site.telegram], ["instagram", site.instagram], ["facebook", site.facebook], ["youtube", site.youtube]].filter(([, url]) => url);
  if (items.length === 0) return null;
  const base = tone === "dark" ? "bg-white/10 text-neutral-300 hover:bg-white hover:text-ink" : "bg-white/15 text-white hover:bg-white/30";
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {items.map(([k, url]) => (
        <a key={k} href={url} target="_blank" rel="noopener noreferrer" aria-label={k} className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${base}`}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d={ICONS[k]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      ))}
    </div>
  );
}
