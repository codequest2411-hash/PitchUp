import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCourse } from "@/lib/catalog";
import { tr } from "@/lib/loc";
import { getUser } from "@/lib/auth";
import { canAccessCourse, userContext } from "@/lib/access";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ProfessionIcon } from "@/components/ProfessionIcon";
import { LessonIcon } from "@/components/LessonIcon";
import { splitBooks } from "@/components/CourseCard";

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ success?: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("courses");
  const tc = await getTranslations("common");
  const course = await getCourse(slug);
  if (!course || !course.published) notFound();

  const user = await getUser();
  const { pro, level } = await userContext(user);
  const access = await canAccessCourse(user, course, pro);
  const levelOk = level >= course.requiredLevel;
  const lessons = course.modules.flatMap((m) => m.lessons);
  const done = new Set(
    user ? (await db.lessonProgress.findMany({ where: { userId: user.id, lessonId: { in: lessons.map((l) => l.id) } } })).map((p) => p.lessonId) : [],
  );
  const next = lessons.find((l) => !done.has(l.id)) ?? lessons[0];
  const complete = lessons.length > 0 && done.size === lessons.length;
  const price = locale === "ka" ? `₾${course.priceGel}` : `$${course.priceUsd}`;
  const desc = splitBooks(tr(course, "description", locale));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {(await searchParams).success && <p className="card border-ok text-ok">{t("purchased")}</p>}
        <Link href={`/professions/${course.profession.slug}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ProfessionIcon slug={course.profession.slug} className="h-4 w-4" /> {tr(course.profession, "title", locale)}
        </Link>
        <h1 className="h1">{tr(course, "title", locale)}</h1>
        <p className="text-lg text-muted">{desc.text}</p>
        {desc.books.length > 0 && (
          <section className="card space-y-3">
            <h2 className="flex items-center gap-2 font-semibold"><LessonIcon k="TEXT" className="h-4 w-4 text-brand" />{t("basedOn", { n: desc.books.length })}</h2>
            <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {desc.books.map((b) => (
                <li key={b} className="flex gap-2"><LessonIcon k="CHECK" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />{b}</li>
              ))}
            </ul>
          </section>
        )}
        {course.modules.map((m) => (
          <section key={m.id} className="card space-y-3">
            <h2 className="h2">{tr(m, "title", locale)}</h2>
            <ol className="divide-y divide-line">
              {m.lessons.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bg text-brand"><LessonIcon k={l.type} className="h-[18px] w-[18px]" /></span>
                  {access && levelOk ? (
                    <Link href={`/learn/${course.slug}/${l.id}`} className="flex-1 hover:text-brand">{tr(l, "title", locale)}</Link>
                  ) : (
                    <span className="flex-1 text-muted">{tr(l, "title", locale)}</span>
                  )}
                  <span className="text-xs text-muted">+{l.xpReward} XP</span>
                  {done.has(l.id) && <span className="text-ok" aria-label={t("completed")}>✓</span>}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <aside className="card h-fit space-y-4 lg:sticky lg:top-24">
        <div className="flex flex-wrap gap-2">
          <span className={`chip ${course.isFree ? "bg-ok/15 text-ok" : "bg-accent/15 text-accent"}`}>{course.isFree ? tc("free") : price}</span>
          <span className="chip bg-bg text-muted">{t("lessons", { n: lessons.length })}</span>
          <span className="chip bg-bg text-muted">{tc("minutes", { min: course.durationMin })}</span>
        </div>
        {user && <p className="text-sm text-muted">{t("progress", { done: done.size, total: lessons.length })}</p>}
        {!levelOk ? (
          <p className="flex items-center gap-2 rounded-xl bg-bg p-3 text-sm"><LessonIcon k="LOCK" className="h-4 w-4 text-muted" />{tc("requiresLevel", { level: course.requiredLevel })}</p>
        ) : access ? (
          complete ? (
            <Link href={`/certificate/${course.slug}`} className="btn-accent w-full">🎓 {t("certificate")}</Link>
          ) : (
            next && <Link href={`/learn/${course.slug}/${next.id}`} className="btn-primary w-full">{done.size ? t("continue") : t("startLearning")}</Link>
          )
        ) : user ? (
          <>
            <CheckoutButton body={{ kind: "course", courseId: course.id, currency: locale === "ka" ? "gel" : "usd" }}>{t("buy", { price })}</CheckoutButton>
            <Link href="/pricing" className="block text-center text-sm text-brand">{t("or")}</Link>
          </>
        ) : (
          <Link href="/login" className="btn-primary w-full">{t("loginToBuy")}</Link>
        )}
      </aside>
    </div>
  );
}
