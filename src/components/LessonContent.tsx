import { getTranslations } from "next-intl/server";
import { LessonIcon } from "./LessonIcon";
import { parseLesson } from "@/lib/lesson-format";


export async function LessonContent({ text }: { text: string }) {
  const t = await getTranslations("lesson");
  const blocks = parseLesson(text);
  return (
    <div className="card space-y-5 text-[17px] leading-relaxed sm:p-7">
      {blocks.map((b, i) => {
        if (b.k === "h") return <h2 key={i} className="pt-1 text-xl font-semibold tracking-tight">{b.text}</h2>;
        if (b.k === "p") return <p key={i} className="text-pretty">{b.text}</p>;
        if (b.k === "ul")
          return (
            <ul key={i} className="space-y-2">
              {b.items.map((it) => (
                <li key={it} className="flex gap-3"><span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />{it}</li>
              ))}
            </ul>
          );
        if (b.k === "tip")
          return (
            <aside key={i} className="rounded-2xl border border-brand/20 bg-brand/[0.06] p-4 sm:p-5">
              <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand">
                <LessonIcon k="FLAME" className="h-4 w-4" />{t("takeaway")}
              </p>
              {b.items.map((it) => <p key={it} className="font-medium">{it}</p>)}
            </aside>
          );
        return (
          <div key={i} className="grid gap-3 sm:grid-cols-2">
            {b.good.length > 0 && (
              <div className="rounded-2xl border border-ok/25 bg-ok/[0.07] p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ok"><LessonIcon k="CHECK" className="h-4 w-4" />{t("sayThis")}</p>
                <ul className="space-y-2 text-[15px]">{b.good.map((g) => <li key={g}>“{g}”</li>)}</ul>
              </div>
            )}
            {b.bad.length > 0 && (
              <div className="rounded-2xl border border-bad/25 bg-bad/[0.06] p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-bad">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
                  {t("avoidThis")}
                </p>
                <ul className="space-y-2 text-[15px] text-muted">{b.bad.map((g) => <li key={g}>“{g}”</li>)}</ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
