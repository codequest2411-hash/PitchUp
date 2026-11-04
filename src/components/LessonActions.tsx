"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { completeLessonAction } from "@/app/actions";
import { LessonIcon } from "./LessonIcon";

type Q = { id: string; text: string; options: string[] };

export function LessonActions(props: {
  lessonId: string; type: string; xp: number; done: boolean; loggedIn: boolean;
  scenarioHref: string | null; nextHref: string; prevHref: string | null; questions: Q[];
}) {
  const t = useTranslations("lesson");
  const [done, setDone] = useState(props.done);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [wrong, setWrong] = useState<Set<string> | null>(null); // null until the first check
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const quiz = props.type === "QUIZ";
  const answered = props.questions.filter((q) => answers[q.id] !== undefined).length;

  const complete = () =>
    start(async () => {
      const res = await completeLessonAction(props.lessonId, answers);
      if (res.ok) {
        setDone(true);
        setWrong(new Set());
        setMsg(quiz ? t("correct", { xp: res.xp }) : null);
      } else if ("wrongIds" in res && res.wrongIds && res.total) {
        setWrong(new Set(res.wrongIds));
        setMsg(t("score", { right: res.total - res.wrongIds.length, total: res.total }));
      }
    });

  return (
    <div className="space-y-4">
      {quiz && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>{t("answered", { n: answered, total: props.questions.length })}</span>
          <span className="h-1.5 w-32 overflow-hidden rounded-full bg-line" aria-hidden>
            <span className="block h-full rounded-full bg-brand transition-all" style={{ width: `${(answered / Math.max(1, props.questions.length)) * 100}%` }} />
          </span>
        </div>
      )}
      {quiz &&
        props.questions.map((q, qi) => {
          const state = wrong === null || answers[q.id] === undefined ? null : wrong.has(q.id) ? "bad" : "ok";
          return (
            <fieldset key={q.id} className={`card space-y-2 transition ${state === "bad" ? "border-bad/50" : state === "ok" ? "border-ok/50" : ""}`}>
              <legend className="flex w-full items-start gap-3 font-semibold">
                <span className="font-mono text-sm text-muted">{qi + 1}.</span>
                <span className="flex-1">{q.text}</span>
                {state === "ok" && <span className="chip bg-ok/15 text-ok"><LessonIcon k="CHECK" className="mr-1 h-3 w-3" />{t("right")}</span>}
                {state === "bad" && <span className="chip bg-bad/15 text-bad">{t("tryAgain")}</span>}
              </legend>
              {q.options.map((o, oi) => (
                <label key={oi} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 transition hover:border-fg/20 has-[:checked]:border-brand has-[:checked]:bg-brand/[0.04]">
                  <input type="radio" name={q.id} checked={answers[q.id] === oi} disabled={done}
                    onChange={() => {
                      setAnswers((a) => ({ ...a, [q.id]: oi }));
                      // A changed answer is unchecked again until the next "Check".
                      setWrong((w) => (w ? new Set([...w].filter((id) => id !== q.id)) : w));
                    }} />
                  {o}
                </label>
              ))}
            </fieldset>
          );
        })}
      {msg && <p role="status" className={`font-medium ${done ? "text-ok" : "text-bad"}`}>{msg}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {props.prevHref && <Link href={props.prevHref} className="btn-ghost">← {t("prev")}</Link>}
        {props.type === "CALL" && props.scenarioHref && <Link href={props.scenarioHref} className="btn-accent"><LessonIcon k="CALL" className="h-4 w-4" />{t("startCall")}</Link>}
        {props.loggedIn && !done && (
          <button onClick={complete} disabled={pending || (quiz && answered < props.questions.length)} className="btn-primary">
            {quiz ? t("check") : t("complete")}
          </button>
        )}
        {done && <span className="btn-ghost pointer-events-none text-ok"><LessonIcon k="CHECK" className="h-4 w-4" />{t("completed")}</span>}
        <Link href={props.nextHref} className="btn-ghost ml-auto">{t("next")} →</Link>
      </div>
    </div>
  );
}
