const ICONS = {
  stollar: "M3 8h18M5 8v10M19 8v10M8 12h8",
  stullar: "M8 4v9M16 4v9M7 13h10v3H7zM8 16v4M16 16v4",
  divanlar: "M4 12a2 2 0 012-2h12a2 2 0 012 2v4H4v-4zM6 10V8a2 2 0 012-2h8a2 2 0 012 2v2M6 16v2M18 16v2",
  shkaflar: "M5 3h14v18H5zM12 3v18M9 11v2M15 11v2",
  krevatlar: "M3 18V8M21 18v-6a3 3 0 00-3-3H10v5M3 14h18M6 11h2",
  "ofis-mebeli": "M9 3h6v8H9zM7 11h10M12 11v6M8 21l4-4 4 4",
};

export default function CategoryIcon({ slug, size = 22, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d={ICONS[slug] || ICONS.stollar} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
