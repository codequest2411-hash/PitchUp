import type { Course, Profession } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/loc";

export async function CourseCard({ course, locale }: { course: Course & { profession: Profession; _count?: { modules: number } }; locale: string }) {
  const t = await getTranslations("common");
  return (
    <Link href={`/courses/${course.slug}`} className="card flex flex-col gap-3 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-28 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[#6b5cf0] text-5xl" aria-hidden>
        {course.profession.icon}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={`chip ${course.isFree ? "bg-ok/15 text-ok" : "bg-accent/15 text-accent"}`}>
          {course.isFree ? t("free") : locale === "ka" ? `₾${course.priceGel}` : `$${course.priceUsd}`}
        </span>
        <span className="chip bg-bg text-muted">{t("level", { level: course.requiredLevel })}</span>
        <span className="chip bg-bg text-muted">{t("minutes", { min: course.durationMin })}</span>
      </div>
      <h3 className="font-bold">{tr(course, "title", locale)}</h3>
      <p className="line-clamp-2 text-sm text-muted">{tr(course, "description", locale)}</p>
    </Link>
  );
}
