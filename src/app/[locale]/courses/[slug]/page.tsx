import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { tr } from "@/lib/loc";
import { getUser } from "@/lib/auth";
import { canAccessCourse, userContext } from "@/lib/access";
import { CheckoutButton } from "@/components/CheckoutButton";

const ICON = { TEXT: "📖", VIDEO: "🎬", QUIZ: "❓", CALL: "📞" };

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ success?: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("courses");
  const tc = await getTranslations("common");
  const course = await db.course.findUnique({
    where: { slug },
    include: { profession: true, modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
  });
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

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {(await searchParams).success && <p className="card border-ok text-ok">{t("purchased")}</p>}
        <Link href={`/professions/${course.profession.slug}`} className="text-sm text-muted hover:text-fg">
          {course.profession.icon} {tr(course.profession, "title", locale)}
        </Link>
        <h1 className="h1">{tr(course, "title", locale)}</h1>
        <p className="text-lg text-muted">{tr(course, "description", locale)}</p>
        {course.modules.map((m) => (
          <section key={m.id} className="card space-y-3">
            <h2 className="h2">{tr(m, "title", locale)}</h2>
            <ol className="divide-y divide-line">
              {m.lessons.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-3">
                  <span aria-hidden>{ICON[l.type]}</span>
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
          <p className="rounded-xl bg-bg p-3 text-sm">🔒 {tc("requiresLevel", { level: course.requiredLevel })}</p>
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
