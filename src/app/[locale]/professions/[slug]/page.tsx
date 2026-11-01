import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProfession } from "@/lib/catalog";
import { tr } from "@/lib/loc";
import { CourseCard } from "@/components/CourseCard";

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("professions");
  const tc = await getTranslations("common");
  const td = await getTranslations("difficulty");
  const p = await getProfession(slug);
  if (!p) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-5xl" aria-hidden>{p.icon}</span>
        <div className="flex-1">
          <h1 className="h1">{tr(p, "title", locale)}</h1>
          <p className="text-muted">{tr(p, "description", locale)}</p>
        </div>
        <Link href={`/practice?profession=${p.slug}`} className="btn-accent">📞 {t("practiceNow")}</Link>
      </div>

      <section className="space-y-4">
        <h2 className="h2">{t("scenarios")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {p.scenarios.map((s) => (
            <Link key={s.id} href={`/practice?profession=${p.slug}&scenario=${s.id}`} className="card flex items-center gap-3 hover:shadow-md">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-brand-fg">{s.customerName[0]}</span>
              <div>
                <p className="font-semibold">{s.customerName} — {tr(s, "title", locale)}</p>
                <p className="text-xs text-muted">{td(s.difficulty)} · {tc("level", { level: s.requiredLevel })}{s.isPro ? ` · ${tc("pro")}` : ""}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="h2">{t("courses")}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {p.courses.map((c) => <CourseCard key={c.id} course={c} locale={locale} />)}
        </div>
      </section>
    </div>
  );
}
