import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { tr } from "@/lib/loc";
import { requireUser } from "@/lib/guard";
import { callsUsedToday, FREE_CALLS_PER_DAY, userContext } from "@/lib/access";
import { FREE_MAX_LEVEL, levelProgress } from "@/lib/levels";
import { SKILLS } from "@/lib/scoring";
import { sellerMemory } from "@/lib/memory";
import { SkillBars, scoreColor } from "@/components/SkillBars";
import { ProfessionTile } from "@/components/ProfessionIcon";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const [t, tc, tl, to, tb, ts] = await Promise.all(["dashboard", "common", "levels", "outcome", "badges", "skills"].map((n) => getTranslations(n)));
  const memory = await sellerMemory(user.id);
  const { pro, level } = await userContext(user);
  const prog = levelProgress(user.xp);
  const capped = !pro && prog.lvl > FREE_MAX_LEVEL;

  const [calls, enrollment, badges, used] = await Promise.all([
    db.call.findMany({ where: { userId: user.id, score: { not: null } }, orderBy: { startedAt: "desc" }, take: 20, include: { scenario: { include: { profession: true } } } }),
    db.enrollment.findFirst({ where: { userId: user.id, completedAt: null }, orderBy: { startedAt: "desc" }, include: { course: { include: { modules: { include: { lessons: true } } } } } }),
    db.userBadge.findMany({ where: { userId: user.id }, include: { badge: true } }),
    callsUsedToday(`user:${user.id}`),
  ]);

  const doneIds = enrollment
    ? new Set((await db.lessonProgress.findMany({ where: { userId: user.id }, select: { lessonId: true } })).map((p) => p.lessonId))
    : new Set<string>();
  const nextLesson = enrollment?.course.modules.flatMap((m) => m.lessons).sort((a, b) => a.order - b.order).find((l) => !doneIds.has(l.id));

  const recommended = await db.scenario.findFirst({
    where: {
      requiredLevel: { lte: level },
      isPro: pro ? undefined : false,
      professionId: calls[0]?.scenario.professionId,
      id: calls[0] ? { not: calls[0].scenarioId } : undefined,
    },
    orderBy: { requiredLevel: "desc" },
    include: { profession: true },
  });

  const history = [...calls].reverse();
  const avg = Object.fromEntries(
    SKILLS.map((k) => [k, calls.length ? Math.round(calls.reduce((s, c) => s + ((c.subScores as Record<string, number>)[k] ?? 0), 0) / calls.length) : 0]),
  );

  return (
    <div className="space-y-6">
      <h1 className="h1">{t("welcome", { name: user.name ?? "" })}</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card space-y-2 md:col-span-2">
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-bold">{tc("level", { level })} · {tl(String(level))}</p>
            <p className="text-sm text-muted">{tc("xp", { xp: user.xp })}</p>
          </div>
          <div className="h-3 rounded-full bg-line" role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-3 rounded-full bg-brand" style={{ width: `${capped ? 100 : prog.pct}%` }} />
          </div>
          <p className="text-sm text-muted">
            {capped ? <Link href="/pricing" className="text-accent">{t("maxFree")}</Link> : prog.to > prog.from ? t("toNext", { xp: prog.to - user.xp }) : ""}
          </p>
        </div>
        <div className="card flex flex-col justify-center gap-2">
          <p className="text-lg font-bold">🔥 {tc("streak", { days: user.streakDays })}</p>
          <p className="text-sm text-muted">📞 {pro ? tc("unlimited") : tc("callsLeft", { n: Math.max(0, FREE_CALLS_PER_DAY - used) })}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="h2">{t("continueLearning")}</h2>
          {enrollment && nextLesson ? (
            <>
              <p>{tr(enrollment.course, "title", locale)}</p>
              <Link href={`/learn/${enrollment.course.slug}/${nextLesson.id}`} className="btn-primary">{tr(nextLesson, "title", locale)} →</Link>
            </>
          ) : (
            <>
              <p className="text-muted">{t("noCourse")}</p>
              <Link href="/courses" className="btn-ghost">{t("browse")}</Link>
            </>
          )}
        </div>
        <div className="card space-y-3">
          <h2 className="h2">{t("recommended")}</h2>
          {recommended && (
            <>
              <p>{recommended.customerName} — {tr(recommended, "title", locale)}</p>
              <Link href={`/practice?scenario=${recommended.id}`} className="btn-accent">📞 {tc("practice")}</Link>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="h2">{t("scoreHistory")}</h2>
          {history.length ? (
            <div className="flex h-40 items-end gap-1" role="img" aria-label={history.map((c) => c.score).join(", ")}>
              {history.map((c) => (
                <div key={c.id} className={`flex-1 rounded-t ${scoreColor(c.score!)}`} style={{ height: `${Math.max(4, c.score!)}%` }} title={String(c.score)} />
              ))}
            </div>
          ) : (
            <p className="text-muted">{t("noCalls")}</p>
          )}
        </div>
        <div className="card space-y-3">
          <h2 className="h2">{t("skillAvg")}</h2>
          {pro ? <SkillBars values={avg} /> : <Link href="/pricing" className="text-accent">🔒 {t("proAnalytics")}</Link>}
        </div>
      </div>

      {memory && (
        <section className="card space-y-3 border-brand/25">
          <div>
            <h2 className="h2">{t("memoryTitle")}</h2>
            <p className="text-sm text-muted">{t("memorySub", { n: memory.calls })}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {memory.weak.map((k) => <span key={k} className="chip bg-bad/10 text-bad">{t("memoryWeak")}: {ts(k)} · {memory.skills[k]}</span>)}
            {memory.strong && <span className="chip bg-ok/15 text-ok">{t("memoryStrong")}: {ts(memory.strong)} · {memory.skills[memory.strong]}</span>}
          </div>
          {memory.recentTips.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm">{memory.recentTips.map((x) => <li key={x}>{x}</li>)}</ul>
          )}
        </section>
      )}

      <div className="card space-y-3">
        <h2 className="h2">{tb("title")}</h2>
        {badges.length ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => <span key={b.badgeId} className="chip bg-bg py-1.5 text-sm">{b.badge.icon} {tr(b.badge, "title", locale)}</span>)}
          </div>
        ) : (
          <p className="text-muted">{tb("none")}</p>
        )}
      </div>

      <div className="card space-y-3">
        <h2 className="h2">{t("recentCalls")}</h2>
        {calls.length ? (
          <ul className="divide-y divide-line">
            {calls.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link href={`/results/${c.id}`} className="flex items-center gap-3 py-3 hover:text-brand">
                  <ProfessionTile p={c.scenario.profession} className="h-9 w-9 rounded-xl" iconClass="h-4.5 w-4.5" />
                  <span className="flex-1">{c.scenario.customerName} — {tr(c.scenario, "title", locale)}</span>
                  <span className="hidden text-sm text-muted sm:inline">{c.outcome && to(c.outcome)}</span>
                  <span className="font-bold tabular-nums">{c.score}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Link href="/practice" className="btn-accent">{t("noCalls")}</Link>
        )}
      </div>
    </div>
  );
}
