"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { completeLessonAction } from "@/app/actions";

type Q = { id: string; text: string; options: string[] };

export function LessonActions(props: {
  lessonId: string; type: string; xp: number; done: boolean; loggedIn: boolean;
  scenarioHref: string | null; nextHref: string; questions: Q[];
}) {
  const t = useTranslations("lesson");
  const [done, setDone] = useState(props.done);
  const [answers, setAnswers] = useState<number[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const complete = () =>
    start(async () => {
      const res = await completeLessonAction(props.lessonId, answers);
      if (res.ok) {
        setDone(true);
        setMsg(props.type === "QUIZ" ? t("correct", { xp: res.xp }) : null);
      } else if ("wrong" in res) setMsg(t("wrong"));
    });

  return (
    <div className="space-y-4">
      {props.type === "QUIZ" &&
        props.questions.map((q, qi) => (
          <fieldset key={q.id} className="card space-y-2">
            <legend className="font-semibold">{q.text}</legend>
            {q.options.map((o, oi) => (
              <label key={oi} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 has-[:checked]:border-brand">
                <input type="radio" name={q.id} checked={answers[qi] === oi} onChange={() => setAnswers((a) => Object.assign([...a], { [qi]: oi }))} />
                {o}
              </label>
            ))}
          </fieldset>
        ))}
      {msg && <p role="status" className={done ? "text-ok" : "text-bad"}>{msg}</p>}
      <div className="flex flex-wrap gap-3">
        {props.type === "CALL" && props.scenarioHref && <Link href={props.scenarioHref} className="btn-accent">📞 {t("startCall")}</Link>}
        {props.loggedIn && !done && (
          <button onClick={complete} disabled={pending || (props.type === "QUIZ" && answers.filter((a) => a !== undefined).length < props.questions.length)} className="btn-primary">
            {props.type === "QUIZ" ? t("check") : t("complete")}
          </button>
        )}
        {done && <span className="btn-ghost pointer-events-none text-ok">✓ {t("completed")}</span>}
        <Link href={props.nextHref} className="btn-ghost">{t("next")} →</Link>
      </div>
    </div>
  );
}
