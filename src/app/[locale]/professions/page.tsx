import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { tr } from "@/lib/loc";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("professions");
  const list = await db.profession.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { courses: true, scenarios: true } } } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">{t("title")}</h1>
        <p className="text-muted">{t("subtitle")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <Link key={p.id} href={`/professions/${p.slug}`} className="card flex gap-4 transition hover:shadow-md">
            <span className="text-4xl" aria-hidden>{p.icon}</span>
            <div className="space-y-1">
              <h2 className="font-bold">{tr(p, "title", locale)}</h2>
              <p className="text-sm text-muted">{tr(p, "description", locale)}</p>
              <p className="text-xs text-muted">{t("courses")}: {p._count.courses} · {t("scenarios")}: {p._count.scenarios}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
