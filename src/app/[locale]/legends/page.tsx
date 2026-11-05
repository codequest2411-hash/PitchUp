import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LEGENDS } from "@/lib/legends";

export async function generateMetadata() {
  const t = await getTranslations("legends");
  return { title: t("title"), description: t("subtitle") };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, ts] = await Promise.all([getTranslations("legends"), getTranslations("skills")]);
  const ka = locale === "ka";

  return (
    <div className="space-y-8">
      <div className="max-w-2xl space-y-2">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="h1">{t("title")}</h1>
        <p className="text-muted">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {LEGENDS.map((l) => (
          <article key={l.name} className="card flex flex-col gap-4">
            <header className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-lg font-bold text-brand" aria-hidden>
                {l.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <div>
                <h2 className="text-lg font-bold">{l.name} <span className="text-sm font-normal text-muted">· {l.years}</span></h2>
                <p className="text-sm text-muted">{ka ? l.roleKa : l.roleEn}</p>
              </div>
            </header>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("start")}</p>
              <p>{ka ? l.startKa : l.startEn}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("how")}</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                {(ka ? l.stepsKa : l.stepsEn).map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
            <div className="mt-auto rounded-xl bg-brand/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">{t("lesson")}</p>
              <p className="font-medium">{ka ? l.lessonKa : l.lessonEn}</p>
            </div>
            <Link href="/practice" className="btn-ghost self-start text-sm">📞 {t("practice", { skill: ts(l.skill) })}</Link>
          </article>
        ))}
      </div>
      <p className="text-xs text-muted">{t("note")}</p>
    </div>
  );
}
