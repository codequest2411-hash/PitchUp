import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { isPro } from "@/lib/access";
import { tr } from "@/lib/loc";
import { PricingCards } from "@/components/PricingCards";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const user = await getUser();
  const professions = await db.profession.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 pt-6 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t("heroTitle")}</h1>
          <p className="text-lg text-muted">{t("heroSub")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={user ? "/practice" : "/register"} className="btn-primary px-6 py-3 text-base">{t("ctaStart")}</Link>
            <Link href="/practice" className="btn-ghost px-6 py-3 text-base">📞 {t("ctaDemo")}</Link>
          </div>
        </div>
        <div className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center rounded-[2rem] bg-[#16123a] text-white shadow-xl" aria-hidden>
          <span className="absolute h-48 w-48 animate-ping rounded-full bg-brand/30" />
          <span className="relative flex h-40 w-40 items-center justify-center rounded-full bg-brand text-6xl ring-8 ring-accent/40">🧑‍💼</span>
          <span className="absolute bottom-8 rounded-full bg-white/10 px-4 py-1.5 text-sm">● 01:24</span>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="h1 text-center">{t("howTitle")}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card space-y-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-bold text-white">{n}</span>
              <h3 className="h2">{t(`step${n}Title`)}</h3>
              <p className="text-muted">{t(`step${n}Text`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="h1 text-center">{t("professionsTitle")}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {professions.map((p) => (
            <Link key={p.id} href={`/professions/${p.slug}`} className="card flex flex-col items-center gap-2 text-center transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="text-3xl" aria-hidden>{p.icon}</span>
              <span className="text-sm font-semibold">{tr(p, "title", locale)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="h1">{t("pricingTitle")}</h2>
          <p className="text-muted">{t("pricingSub")}</p>
        </div>
        <PricingCards currency={locale === "ka" ? "gel" : "usd"} loggedIn={Boolean(user)} pro={await isPro(user?.id)} />
      </section>

      <section className="space-y-6">
        <h2 className="h1 text-center">{t("testimonialsTitle")}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <figure key={n} className="card space-y-3">
              <blockquote className="text-lg">“{t(`t${n}`)}”</blockquote>
              <figcaption className="text-sm text-muted">— {t(`t${n}Name`)}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-4">
        <h2 className="h1 text-center">{t("faqTitle")}</h2>
        {[1, 2, 3, 4].map((n) => (
          <details key={n} className="card">
            <summary className="cursor-pointer font-semibold">{t(`q${n}`)}</summary>
            <p className="mt-2 text-muted">{t(`a${n}`)}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
