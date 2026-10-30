import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { loadCall } from "@/lib/calls";
import { SkillBars } from "@/components/SkillBars";
import type { Line } from "@/lib/scoring";

const OUTCOME_STYLE = { SOLD: "bg-ok/15 text-ok", FOLLOW_UP: "bg-accent/15 text-accent", LOST: "bg-bad/15 text-bad" };

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("results");
  const to = await getTranslations("outcome");
  const call = await loadCall(id);
  if (!call) notFound();
  if (!call.endedAt) redirect({ href: `/call/${id}`, locale });
  if (call.score == null) return <p className="card text-center">{(await getTranslations("call"))("scoring")}</p>;

  const fb = call.feedback as { wellDone: string[]; improve: string[]; rewrite: string };
  const transcript = call.transcript as Line[];
  const score = call.score;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="h1">{t("title")}</h1>
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="card flex flex-col items-center gap-3 text-center">
          <div className="relative h-36 w-36">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--line)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" strokeLinecap="round"
                stroke={score >= 70 ? "var(--ok)" : score >= 50 ? "var(--accent)" : "var(--bad)"} strokeDasharray={`${score} 100`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-4xl font-extrabold">{score}</span>
          </div>
          <p className="text-sm text-muted">{t("score")}</p>
          {call.outcome && <span className={`chip ${OUTCOME_STYLE[call.outcome]}`}>{t("outcome")}: {to(call.outcome)}</span>}
          {call.xpEarned > 0 && <span className="chip bg-brand text-brand-fg">{t("xpEarned", { xp: call.xpEarned })}</span>}
          <p className="text-xs text-muted">{t("duration", { sec: call.durationSec ?? 0 })}</p>
        </div>
        <div className="card">
          <SkillBars values={call.subScores as Record<string, number>} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card space-y-2">
          <h2 className="h2">✅ {t("wellDone")}</h2>
          <ul className="list-disc space-y-1 pl-5">{fb.wellDone.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section className="card space-y-2">
          <h2 className="h2">🎯 {t("improve")}</h2>
          <ul className="list-disc space-y-1 pl-5">{fb.improve.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      </div>
      <section className="card space-y-2 border-l-4 border-l-accent">
        <h2 className="h2">✍️ {t("rewrite")}</h2>
        <p className="text-lg italic">{fb.rewrite}</p>
      </section>

      <details className="card">
        <summary className="cursor-pointer font-semibold">{t("transcript")} ({transcript.length})</summary>
        <div className="mt-4 space-y-2">
          {transcript.map((l, i) => (
            <p key={i} className="text-sm">
              <b>{l.role === "user" ? "🧑 " : `📞 ${call.scenario.customerName}: `}</b>{l.text}
            </p>
          ))}
        </div>
      </details>

      <div className="flex flex-wrap gap-3">
        <Link href={`/practice?scenario=${call.scenarioId}`} className="btn-accent">🔁 {t("again")}</Link>
        {call.userId && <Link href="/dashboard" className="btn-ghost">{t("dashboard")}</Link>}
      </div>
    </div>
  );
}
