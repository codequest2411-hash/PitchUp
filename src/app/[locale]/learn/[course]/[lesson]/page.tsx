import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCourse } from "@/lib/catalog";
import { tr } from "@/lib/loc";
import { getUser } from "@/lib/auth";
import { canAccessCourse, userContext } from "@/lib/access";
import { LessonActions } from "@/components/LessonActions";

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

  const done = user ? Boolean(await db.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } })) : false;
  const next = lessons[idx + 1];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/courses/${slug}`} className="text-sm text-muted hover:text-fg">← {tr(course, "title", locale)}</Link>
      <h1 className="h1">{tr(lesson, "title", locale)}</h1>
      {lesson.videoUrl && (
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe src={lesson.videoUrl} className="h-full w-full" allowFullScreen title={tr(lesson, "title", locale)} />
        </div>
      )}
      {tr(lesson, "content", locale) && <div className="card whitespace-pre-line text-lg leading-relaxed">{tr(lesson, "content", locale)}</div>}

      <LessonActions
        lessonId={lesson.id}
        type={lesson.type}
        xp={lesson.xpReward}
        done={done}
        loggedIn={Boolean(user)}
        scenarioHref={lesson.scenarioId ? `/practice?scenario=${lesson.scenarioId}` : null}
        nextHref={next ? `/learn/${slug}/${next.id}` : `/courses/${slug}`}
        questions={lesson.questions.map((q) => ({ id: q.id, text: tr(q, "question", locale), options: (q.options as { ka: string; en: string }[]).map((o) => (locale === "en" ? o.en : o.ka)) }))}
      />
      {!user && <p className="text-sm text-muted">{t("loginToSave")}</p>}
    </div>
  );
}
