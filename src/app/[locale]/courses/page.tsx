import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCourses, getPopularCourses, getProfessions } from "@/lib/catalog";
import { tr } from "@/lib/loc";
import { CourseCard } from "@/components/CourseCard";
import { ProfessionIcon, ProfessionTile } from "@/components/ProfessionIcon";
import { LessonIcon } from "@/components/LessonIcon";

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
  const library = all.filter((c) => c.profession.slug === "sales-mastery");
  const lessonCount = all.reduce((n, c) => n + c.modules.reduce((m, mod) => m + mod.lessons.length, 0), 0);
  // Unfiltered catalog is shown per profession (a preview of each), so 80+ cards don't form one wall.
  const groups = professions
    .map((p) => ({ p, list: courses.filter((c) => c.professionId === p.id) }))
    .filter((g) => g.list.length > 0);
  const steps = [
    { k: "TEXT" as const, title: t("step1Title"), body: t("step1Body") },
    { k: "QUIZ" as const, title: t("step2Title"), body: t("step2Body") },
    { k: "CALL" as const, title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <div className="space-y-12">
      {/* Photo sits in its own panel at full brightness; the source is only 736px wide, so it is never stretched full-bleed. */}
      <section className="grid overflow-hidden rounded-3xl bg-[#0b0d17] text-white md:grid-cols-[1.15fr_1fr]">
        <div className="relative aspect-[4/3] md:order-2 md:aspect-auto">
          <Image src="/images/closer-floor.webp" alt="" fill priority sizes="(max-width: 768px) 100vw, 520px" className="object-cover object-[center_35%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d17] via-transparent to-transparent md:bg-gradient-to-r" aria-hidden />
        </div>
        <div className="relative space-y-5 px-6 pb-10 pt-6 sm:px-10 md:py-16">
          <span className="eyebrow border-white/20 bg-white/10 text-white">{t("heroEyebrow")}</span>
          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-balance sm:text-5xl">{t("heroTitle")}</h1>
          <p className="text-white/75 text-pretty">{t("heroSub")}</p>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 pt-2">
            {[
              [all.length, t("statCourses")],
              [lessonCount, t("statLessons")],
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

      {!filtered && (
        <section aria-labelledby="how" className="space-y-5">
          <h2 id="how" className="h2">{t("howTitle")}</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((st, i) => (
              <li key={st.k} className="card relative flex gap-4">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${st.k === "CALL" ? "bg-brand text-brand-fg" : "bg-bg text-fg"}`}>
                  <LessonIcon k={st.k} className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-mono text-xs text-muted">0{i + 1}</p>
                  <h3 className="font-semibold">{st.title}</h3>
                  <p className="mt-1 text-sm text-muted text-pretty">{st.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!filtered && library.length > 0 && (
        <section className="overflow-hidden rounded-3xl bg-[#0b0d17] p-6 text-white sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-4">
              <span className="eyebrow border-white/20 bg-white/10 text-white"><ProfessionIcon slug="sales-mastery" className="h-3.5 w-3.5" />{t("libraryEyebrow")}</span>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-balance sm:text-3xl">{t("libraryTitle")}</h2>
              <p className="text-white/70 text-pretty">{t("librarySub", { n: library.length })}</p>
              <Link href={withProfession("sales-mastery")} className="btn bg-white text-[#0b0d17] hover:bg-white/90">
                {t("libraryCta")} <LessonIcon k="ARROW" className="h-4 w-4" />
              </Link>
            </div>
            <ul className="grid gap-x-6 sm:grid-cols-2">
              {library.map((c) => (
                <li key={c.id}>
                  <Link href={`/courses/${c.slug}`} className="group flex items-center gap-3 border-b border-white/10 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 text-white/85 group-hover:text-white">{tr(c, "title", locale)}</span>
                    <span className={`shrink-0 text-xs ${c.isFree ? "text-[#4ade80]" : "text-white/45"}`}>
                      {c.isFree ? tc("free") : locale === "ka" ? `₾${c.priceGel}` : `$${c.priceUsd}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {!filtered && popular.length > 0 && (
        <section className="space-y-5">
          <div>
            <h2 className="h2 flex items-center gap-2"><LessonIcon k="FLAME" className="h-5 w-5 text-[#f97316]" />{t("popular")}</h2>
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
              className={`chip shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 ${sp.profession === p.slug ? "bg-fg text-bg" : "border border-line bg-card hover:border-fg/20"}`}>
              <ProfessionIcon slug={p.slug} className="h-3.5 w-3.5" /> {tr(p, "title", locale)}
            </Link>
          ))}
        </nav>

        {courses.length === 0 ? (
          <p className="card text-center text-muted">{t("empty")}</p>
        ) : !filtered ? (
          <div className="space-y-10 pt-2">
            {groups.map(({ p, list }) => (
              <div key={p.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <ProfessionTile p={p} className="h-10 w-10" iconClass="h-5 w-5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold tracking-tight">{tr(p, "title", locale)}</h3>
                    <p className="text-xs text-muted">{t("found", { n: list.length })}</p>
                  </div>
                  {list.length > 4 && (
                    <Link href={withProfession(p.slug)} className="btn-ghost shrink-0 py-1.5 text-xs">
                      {t("seeAll", { n: list.length })} <LessonIcon k="ARROW" className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {list.slice(0, 4).map((c) => <CourseCard key={c.id} course={c} locale={locale} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((c) => <CourseCard key={c.id} course={c} locale={locale} />)}
          </div>
        )}
      </section>
    </div>
  );
}
