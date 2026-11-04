import type { Course, Profession } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/loc";
import { ProfessionIcon, professionHue } from "./ProfessionIcon";

type CardCourse = Course & { profession: Profession; _count?: { modules: number; enrollments?: number } };

export async function CourseCard({ course, locale, rank }: { course: CardCourse; locale: string; rank?: number }) {
  const t = await getTranslations("common");
  const tc = await getTranslations("courses");
  const h = professionHue(course.profession.order);
  const enrolled = course._count?.enrollments ?? 0;
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group card flex flex-col gap-3 overflow-hidden p-0 transition hover:-translate-y-0.5 hover:border-fg/15 hover:shadow-[0_16px_40px_-20px_rgb(16_24_40/0.35)]"
    >
      <div
        className="relative flex h-32 items-end justify-between p-4"
        style={{ background: `linear-gradient(135deg, hsl(${h} 85% 94%), hsl(${(h + 30) % 360} 70% 84%))` }}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm transition group-hover:scale-105" style={{ color: `hsl(${h} 65% 38%)` }}>
          <ProfessionIcon slug={course.profession.slug} className="h-7 w-7" />
        </span>
        <span className={`chip ${course.isFree ? "bg-ok text-white" : "bg-fg text-bg"}`}>
          {course.isFree ? t("free") : locale === "ka" ? `₾${course.priceGel}` : `$${course.priceUsd}`}
        </span>
        {rank && <span className="absolute left-4 top-3 font-mono text-xs font-semibold text-fg/60">#{rank}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 pb-5">
        <p className="text-xs font-medium text-muted">{tr(course.profession, "title", locale)}</p>
        <h3 className="font-semibold leading-snug tracking-tight">{tr(course, "title", locale)}</h3>
        <p className="line-clamp-2 text-sm text-muted">{tr(course, "description", locale)}</p>
        <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-2 text-xs text-muted">
          <span>{t("level", { level: course.requiredLevel })}</span>
          <span>· {t("minutes", { min: course.durationMin })}</span>
          {enrolled > 0 && <span>· {tc("students", { n: enrolled })}</span>}
        </div>
      </div>
    </Link>
  );
}
