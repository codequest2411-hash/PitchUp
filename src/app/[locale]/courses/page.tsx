import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCourses, getPopularCourses, getProfessions } from "@/lib/catalog";
import { tr } from "@/lib/loc";
import { CourseCard } from "@/components/CourseCard";

type Search = { profession?: string; price?: string; level?: string };

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Search> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("courses");
  const tc = await getTranslations("common");
  const filtered = Boolean(sp.profession || sp.price || sp.level);
  const [professions, courses, all, popular] = await Promise.all([
    getProfessions(),
    getCourses(sp.profession, sp.price, Number(sp.level) || undefined),
    getCourses(),
    getPopularCourses(4),
  ]);
  // Profession pills keep the other filters, so they combine with price/level.
  const withProfession = (slug?: string) => ({ pathname: "/courses", query: { ...sp, profession: slug } });

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-[#0b0d17] text-white">
        <Image src="/images/closer-floor.webp" alt="" fill priority sizes="(max-width: 1200px) 100vw, 1200px" className="object-cover object-[center_30%] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d17] via-[#0b0d17]/85 to-transparent" aria-hidden />
        <div className="relative max-w-xl space-y-5 px-6 py-12 sm:px-10 sm:py-16">
          <span className="eyebrow border-white/20 bg-white/10 text-white">{t("heroEyebrow")}</span>
          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-balance sm:text-5xl">{t("heroTitle")}</h1>
          <p className="text-white/75 text-pretty">{t("heroSub")}</p>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 pt-2">
            {[
              [all.length, t("statCourses")],
              [professions.length, t("statProfessions")],
              [all.filter((c) => c.isFree).length, t("statFree")],
            ].map(([n, label]) => (
              <div key={String(label)}>
                <dt className="sr-only">{label}</dt>
                <dd><span className="text-2xl font-semibold tabular-nums">{n}</span> <span className="text-sm text-white/65">{label}</span></dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {!filtered && popular.length > 0 && (
        <section className="space-y-5">
          <div>
            <h2 className="h2">🔥 {t("popular")}</h2>
            <p className="text-sm text-muted">{t("popularSub")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((c, i) => <CourseCard key={c.id} course={c} locale={locale} rank={i + 1} />)}
          </div>
        </section>
      )}

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="h2">{t("all")}</h2>
            <p className="text-sm text-muted">{t("found", { n: courses.length })}</p>
          </div>
          {/* Plain GET form: filters work without JS and are shareable as URLs. */}
          <form className="flex flex-wrap items-end gap-2">
            {sp.profession && <input type="hidden" name="profession" value={sp.profession} />}
            <label className="sr-only" htmlFor="price">{t("filterPrice")}</label>
            <select id="price" name="price" defaultValue={sp.price ?? ""} className="input w-auto py-2 text-sm">
              <option value="">{t("filterPrice")}: {tc("all")}</option>
              <option value="free">{tc("free")}</option>
              <option value="paid">{tc("paid")}</option>
            </select>
            <label className="sr-only" htmlFor="level">{t("filterLevel")}</label>
            <select id="level" name="level" defaultValue={sp.level ?? ""} className="input w-auto py-2 text-sm">
              <option value="">{t("filterLevel")}: {tc("all")}</option>
              {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>{tc("level", { level: l })}</option>)}
            </select>
            <button className="btn-primary py-2 text-sm">{t("apply")}</button>
            {filtered && <Link href="/courses" className="btn-ghost py-2 text-sm">{t("reset")}</Link>}
          </form>
        </div>

        <nav aria-label={t("filterProfession")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <Link href={withProfession(undefined)} className={`chip shrink-0 px-3.5 py-1.5 ${!sp.profession ? "bg-fg text-bg" : "border border-line bg-card hover:border-fg/20"}`}>
            {tc("all")}
          </Link>
          {professions.map((p) => (
            <Link key={p.id} href={withProfession(p.slug)} aria-current={sp.profession === p.slug ? "page" : undefined}
              className={`chip shrink-0 px-3.5 py-1.5 ${sp.profession === p.slug ? "bg-fg text-bg" : "border border-line bg-card hover:border-fg/20"}`}>
              <span aria-hidden>{p.icon}</span> {tr(p, "title", locale)}
            </Link>
          ))}
        </nav>

        {courses.length === 0 ? (
          <p className="card text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((c) => <CourseCard key={c.id} course={c} locale={locale} />)}
          </div>
        )}
      </section>
    </div>
  );
}
