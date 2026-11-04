import type { ReactNode } from "react";

// Line icons per profession (paths after Lucide, ISC licence) instead of emoji, so they match the UI and render the same everywhere.
const PATHS: Record<string, ReactNode> = {
  "sales-mastery": <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
  "real-estate": <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>,
  "car-sales": <><path d="M5 17H3v-5l2-5h14l2 5v5h-2" /><path d="M3 12h18" /><circle cx="7.5" cy="17" r="2" /><circle cx="16.5" cy="17" r="2" /><path d="M9.5 17h5" /></>,
  insurance: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  "b2b-saas": <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M2 20h20" /><path d="m9 9-1.5 1.5L9 12" /><path d="m15 9 1.5 1.5L15 12" /></>,
  retail: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
  banking: <><path d="M3 22h18" /><path d="M6 18v-7" /><path d="M10 18v-7" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="m12 2 9 5H3Z" /></>,
  freelancer: <><path d="m12 19 7-7 3 3-7 7-3-3Z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z" /><path d="m2 2 7.6 7.6" /><circle cx="11" cy="11" r="2" /></>,
  hospitality: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></>,
  "startup-pitch": <><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1Z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2Z" /><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0" /><path d="M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5" /></>,
};
const SPARKLES = <><path d="M9.9 15.5A2 2 0 0 0 8.5 14.1L2.4 12.5a.5.5 0 0 1 0-1l6.1-1.6a2 2 0 0 0 1.4-1.4l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0Z" /><path d="M20 3v4" /><path d="M22 5h-4" /></>;

// Each profession keeps its own hue across cards, tiles and pills.
export const professionHue = (order: number) => (order * 37 + 225) % 360;

export function ProfessionIcon({ slug, className = "h-5 w-5" }: { slug: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[slug] ?? SPARKLES}
    </svg>
  );
}

// Tinted rounded tile holding the icon; size via className (e.g. "h-12 w-12").
export function ProfessionTile({ p, className = "h-12 w-12", iconClass = "h-6 w-6" }: { p: { slug: string; order: number }; className?: string; iconClass?: string }) {
  const h = professionHue(p.order);
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-2xl ${className}`}
      style={{ background: `hsl(${h} 90% 95%)`, color: `hsl(${h} 65% 38%)`, boxShadow: `inset 0 0 0 1px hsl(${h} 60% 85%)` }}>
      <ProfessionIcon slug={p.slug} className={iconClass} />
    </span>
  );
}
