import type { Course, LessonType, Profession } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/loc";
import { ProfessionIcon, professionHue } from "./ProfessionIcon";
import { LessonIcon } from "./LessonIcon";

type CardLesson = { type: LessonType; titleEn: string; titleKa: string };
type CardCourse = Course & { profession: Profession; _count?: { enrollments?: number }; modules?: { lessons: CardLesson[] }[] };

// Book courses store their sources after a marker in the description ("Based on: A · B").
export function splitBooks(desc: string) {
  const m = desc.match(/\s(?:Based on|წიგნები):\s/);
  if (!m || m.index === undefined) return { text: desc, books: [] as string[] };
  return { text: desc.slice(0, m.index), books: desc.slice(m.index + m[0].length).split(" · ").map((b) => b.trim()).filter(Boolean) };
}

export async function CourseCard({ course, locale, rank }: { course: CardCourse; locale: string; rank?: number }) {
  const t = await getTranslations("common");
  const tc = await getTranslations("courses");
  const h = professionHue(course.profession.order);
  const enrolled = course._count?.enrollments ?? 0;
  const lessons = course.modules?.flatMap((m) => m.lessons) ?? [];
  // Older generic courses have a single "Theory" lesson; their description says more than its title.
  const topics = lessons.filter((l) => l.type === "TEXT" && l.titleEn !== "Theory").slice(0, 3);
  const { text, books } = splitBooks(tr(course, "description", locale));
  const has = (type: LessonType) => lessons.some((l) => l.type === type);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group card flex flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:border-fg/15 hover:shadow-[0_16px_40px_-20px_rgb(16_24_40/0.35)]"
    >
      <div className="relative flex items-center gap-3 px-5 pb-4 pt-5"
        style={{ background: `linear-gradient(135deg, hsl(${h} 85% 96%), hsl(${(h + 30) % 360} 70% 90%))` }}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/85 shadow-sm transition group-hover:scale-105" style={{ color: `hsl(${h} 65% 38%)` }}>
          <ProfessionIcon slug={course.profession.slug} className="h-5 w-5" />
        </span>
        <p className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: `hsl(${h} 45% 30%)` }}>{tr(course.profession, "title", locale)}</p>
        <span className={`chip shrink-0 ${course.isFree ? "bg-ok text-white" : "bg-fg text-bg"}`}>
          {course.isFree ? t("free") : locale === "ka" ? `₾${course.priceGel}` : `$${course.priceUsd}`}
        </span>
        {rank && <span className="absolute left-2 top-1.5 font-mono text-[10px] font-semibold text-fg/50">#{rank}</span>}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        <h3 className="font-semibold leading-snug tracking-tight text-balance group-hover:text-brand">{tr(course, "title", locale)}</h3>

        {topics.length > 0 ? (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{tc("youLearn")}</p>
            <ul className="space-y-1">
              {topics.map((l) => (
                <li key={l.titleEn} className="flex gap-2 text-sm leading-snug">
                  <LessonIcon k="CHECK" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
                  <span>{tr(l, "title", locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="line-clamp-3 text-sm text-muted">{text}</p>
        )}

        {lessons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="chip gap-1 bg-bg font-medium text-muted"><LessonIcon k="TEXT" className="h-3 w-3" />{tc("lessons", { n: lessons.filter((l) => l.type === "TEXT" || l.type === "VIDEO").length })}</span>
            {has("QUIZ") && <span className="chip gap-1 bg-bg font-medium text-muted"><LessonIcon k="QUIZ" className="h-3 w-3" />{tc("quiz")}</span>}
            {has("CALL") && <span className="chip gap-1 bg-brand/10 font-medium text-brand"><LessonIcon k="CALL" className="h-3 w-3" />{tc("aiCall")}</span>}
          </div>
        )}

        {books.length > 0 && (
          <p className="line-clamp-2 text-xs text-muted" title={books.join(" · ")}>
            <span className="font-semibold text-fg">{tc("basedOn", { n: books.length })}</span> {books.map((b) => b.replace(/\s*\(.*\)$/, "")).join(", ")}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><LessonIcon k="LEVEL" className="h-3.5 w-3.5" />{t("level", { level: course.requiredLevel })}</span>
          <span className="inline-flex items-center gap-1"><LessonIcon k="CLOCK" className="h-3.5 w-3.5" />{t("minutes", { min: course.durationMin })}</span>
          {enrolled > 0 && <span className="inline-flex items-center gap-1"><LessonIcon k="USERS" className="h-3.5 w-3.5" />{tc("students", { n: enrolled })}</span>}
          <LessonIcon k="ARROW" className="ml-auto h-4 w-4 text-fg/40 transition group-hover:translate-x-0.5 group-hover:text-brand" />
        </div>
      </div>
    </Link>
  );
}
