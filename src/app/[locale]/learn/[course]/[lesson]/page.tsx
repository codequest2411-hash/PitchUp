import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCourse } from "@/lib/catalog";
import { tr } from "@/lib/loc";
import { getUser } from "@/lib/auth";
import { canAccessCourse, userContext } from "@/lib/access";
import { LessonActions } from "@/components/LessonActions";
import { LessonContent } from "@/components/LessonContent";
import { LessonIcon } from "@/components/LessonIcon";

export default async function Page({ params }: { params: Promise<{ locale: string; course: string; lesson: string }> }) {
  const { locale, course: slug, lesson: lessonId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("lesson");
  const course = await getCourse(slug);
  const lessons = course?.modules.flatMap((m) => m.lessons) ?? [];
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (!course || idx < 0) notFound();
  const lesson = lessons[idx];

  const user = await getUser();
  const { pro, level } = await userContext(user);
  if (!(await canAccessCourse(user, course, pro)) || level < course.requiredLevel) redirect({ href: `/courses/${slug}`, locale });

  const doneIds = new Set(
    user ? (await db.lessonProgress.findMany({ where: { userId: user.id, lessonId: { in: lessons.map((l) => l.id) } }, select: { lessonId: true } })).map((p) => p.lessonId) : [],
  );
  const done = doneIds.has(lessonId);
  const next = lessons[idx + 1];
  const prev = lessons[idx - 1];
  const content = tr(lesson, "content", locale);
  const minutes = Math.max(1, Math.round(content.split(/\s+/).length / 180));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/courses/${slug}`} className="text-sm text-muted hover:text-fg">← {tr(course, "title", locale)}</Link>

      {/* Stepper: one segment per lesson, filled when done, current one highlighted. */}
      <nav aria-label={t("progress", { n: idx + 1, total: lessons.length })} className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-medium">{t("progress", { n: idx + 1, total: lessons.length })}</span>
          {lesson.type === "TEXT" && <span className="inline-flex items-center gap-1"><LessonIcon k="CLOCK" className="h-3.5 w-3.5" />{t("readTime", { min: minutes })}</span>}
        </div>
        <ol className="flex gap-1.5">
          {lessons.map((l, i) => (
            <li key={l.id} className="flex-1">
              <Link href={`/learn/${slug}/${l.id}`} aria-current={i === idx ? "step" : undefined} title={tr(l, "title", locale)}
                className={`block h-1.5 rounded-full transition hover:opacity-80 ${i === idx ? "bg-brand" : doneIds.has(l.id) ? "bg-ok" : "bg-line"}`} />
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex items-start gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${lesson.type === "CALL" ? "bg-brand text-brand-fg" : "bg-card text-brand ring-1 ring-line"}`}>
          <LessonIcon k={lesson.type} className="h-5 w-5" />
        </span>
        <h1 className="h1">{tr(lesson, "title", locale)}</h1>
      </div>
      {lesson.videoUrl && (
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe src={lesson.videoUrl} className="h-full w-full" allowFullScreen title={tr(lesson, "title", locale)} />
        </div>
      )}
      {content && <LessonContent text={content} />}

      <LessonActions
        lessonId={lesson.id}
        type={lesson.type}
        xp={lesson.xpReward}
        done={done}
        loggedIn={Boolean(user)}
        scenarioHref={lesson.scenarioId ? `/practice?scenario=${lesson.scenarioId}` : null}
        nextHref={next ? `/learn/${slug}/${next.id}` : `/courses/${slug}`}
        prevHref={prev ? `/learn/${slug}/${prev.id}` : null}
        questions={lesson.questions.map((q) => ({ id: q.id, text: tr(q, "question", locale), options: (q.options as { ka: string; en: string }[]).map((o) => (locale === "en" ? o.en : o.ka)) }))}
      />
      {!user && <p className="text-sm text-muted">{t("loginToSave")}</p>}
    </div>
  );
}
