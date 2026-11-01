import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCourses, getProfessions } from "@/lib/catalog";
import { tr } from "@/lib/loc";
import { CourseCard } from "@/components/CourseCard";

type Search = { profession?: string; price?: string; level?: string };

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Search> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("courses");
  const tc = await getTranslations("common");
  const [professions, courses] = await Promise.all([
    getProfessions(),
    getCourses(sp.profession, sp.price, Number(sp.level) || undefined),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="h1">{t("title")}</h1>
      {/* Plain GET form: filters work without JS and are shareable as URLs. */}
      <form className="card grid gap-3 sm:grid-cols-4 sm:items-end">
        <div>
          <label className="label" htmlFor="profession">{t("filterProfession")}</label>
          <select id="profession" name="profession" defaultValue={sp.profession ?? ""} className="input">
            <option value="">{tc("all")}</option>
            {professions.map((p) => <option key={p.id} value={p.slug}>{tr(p, "title", locale)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="price">{t("filterPrice")}</label>
          <select id="price" name="price" defaultValue={sp.price ?? ""} className="input">
            <option value="">{tc("all")}</option>
            <option value="free">{tc("free")}</option>
            <option value="paid">{tc("paid")}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="level">{t("filterLevel")}</label>
          <select id="level" name="level" defaultValue={sp.level ?? ""} className="input">
            <option value="">{tc("all")}</option>
            {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>{tc("level", { level: l })}</option>)}
          </select>
        </div>
        <button className="btn-primary">{t("apply")}</button>
      </form>
      {courses.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((c) => <CourseCard key={c.id} course={c} locale={locale} />)}
        </div>
      )}
    </div>
  );
}
