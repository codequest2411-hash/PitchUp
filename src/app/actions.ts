"use server";
import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getUser, SESSION_COOKIE } from "@/lib/auth";
import { addXp, awardBadge } from "@/lib/rewards";
import { canAccessCourse, userContext } from "@/lib/access";
import { stripe } from "@/lib/payments";
import { adminAuth } from "@/lib/firebase-admin";

const locale = z.enum(["ka", "en"]);

export async function setLocaleAction(l: string) {
  const user = await getUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { locale: locale.parse(l) } });
}

export async function updateProfileAction(form: FormData) {
  const user = await getUser();
  if (!user) return;
  const data = z
    .object({ name: z.string().trim().min(1).max(80), locale, optOut: z.string().optional() })
    .parse(Object.fromEntries(form));
  await db.user.update({
    where: { id: user.id },
    data: { name: data.name, locale: data.locale, leaderboardOptOut: data.optOut === "on" },
  });
  revalidatePath("/", "layout");
}

export async function deleteAccountAction() {
  const user = await getUser();
  if (!user) return;
  // Stop billing before the records that link us to Stripe are gone.
  const subs = await db.subscription.findMany({ where: { userId: user.id, status: { in: ["active", "trialing", "past_due"] } } });
  for (const s of subs) await stripe().subscriptions.cancel(s.stripeSubId);
  if (!user.firebaseUid.startsWith("dev:")) await adminAuth().deleteUser(user.firebaseUid).catch(() => {});
  await db.user.delete({ where: { id: user.id } }); // cascades to calls, progress, purchases
  (await cookies()).delete(SESSION_COOKIE);
}

// Marks a lesson done once; quiz answers are checked here, never trusted from the client.
export async function completeLessonAction(lessonId: string, answers: number[] = []) {
  const user = await getUser();
  if (!user) return { ok: false as const };
  const lesson = await db.lesson.findUnique({
    where: { id: z.string().parse(lessonId) },
    include: { questions: true, module: { include: { course: { include: { modules: { include: { lessons: true } } } } } } },
  });
  if (!lesson) return { ok: false as const };
  const { pro } = await userContext(user);
  if (!(await canAccessCourse(user, lesson.module.course, pro))) return { ok: false as const };
  if (lesson.type === "QUIZ" && lesson.questions.some((q, i) => q.correctIndex !== answers[i])) {
    return { ok: false as const, wrong: true };
  }

  const course = lesson.module.course;
  const existing = await db.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } });
  let xp = 0;
  if (!existing) {
    await db.lessonProgress.create({ data: { userId: user.id, lessonId } });
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      create: { userId: user.id, courseId: course.id },
      update: {},
    });
    xp = await addXp(user, lesson.xpReward);

    const ids = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const done = await db.lessonProgress.count({ where: { userId: user.id, lessonId: { in: ids } } });
    if (done === ids.length) {
      await db.enrollment.update({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        data: { completedAt: new Date(), certificateUrl: `/certificate/${course.slug}` },
      });
      await awardBadge(user.id, "COURSE_DONE");
    }
  }
  revalidatePath("/", "layout");
  return { ok: true as const, xp };
}
