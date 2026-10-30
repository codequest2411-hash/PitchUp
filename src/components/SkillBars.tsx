import { getTranslations } from "next-intl/server";
import { SKILLS } from "@/lib/scoring";

export const scoreColor = (s: number) => (s >= 70 ? "bg-ok" : s >= 50 ? "bg-accent" : "bg-bad");

export async function SkillBars({ values }: { values: Record<string, number> }) {
  const t = await getTranslations("skills");
  return (
    <dl className="space-y-3">
      {SKILLS.map((k) => (
        <div key={k}>
          <div className="flex justify-between text-sm">
            <dt>{t(k)}</dt>
            <dd className="font-semibold tabular-nums">{values[k] ?? 0}</dd>
          </div>
          <div className="mt-1 h-2 rounded-full bg-line">
            <div className={`h-2 rounded-full ${scoreColor(values[k] ?? 0)}`} style={{ width: `${values[k] ?? 0}%` }} />
          </div>
        </div>
      ))}
    </dl>
  );
}
