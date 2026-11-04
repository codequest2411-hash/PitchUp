import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProfessions } from "@/lib/catalog";
import { getUser } from "@/lib/auth";
import { isPro } from "@/lib/access";
import { tr } from "@/lib/loc";
import { PricingCards } from "@/components/PricingCards";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const td = await getTranslations("difficulty");
  const tcall = await getTranslations("call");
  const tcommon = await getTranslations("common");
  const user = await getUser();
  const professions = await getProfessions();

  return (
    <div className="space-y-20">
      <section className="relative grid items-center gap-12 pt-8 md:grid-cols-[1.1fr_1fr] md:pt-14">
        {/* Soft brand glow behind the hero; purely decorative. */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-80 w-[46rem] max-w-full -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="min-w-0 space-y-7">
          <span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-ok" />{t("heroEyebrow")}</span>
          <h1 className="text-[2.1rem] font-semibold leading-[1.08] break-words tracking-[-0.04em] text-balance sm:text-6xl">{t("heroTitle")}</h1>
          <p className="max-w-xl text-lg text-muted text-pretty">{t("heroSub")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={user ? "/practice" : "/register"} className="btn-accent px-6 py-3 text-base">{t("ctaStart")} →</Link>
            <Link href="/practice" className="btn-ghost px-6 py-3 text-base">{t("ctaDemo")}</Link>
          </div>
        </div>
        {/* Static picture of a live call: the product, not stock art. */}
        <div className="card relative mx-auto w-full max-w-md space-y-5 p-6 shadow-[0_30px_60px_-30px_rgb(16_24_40/0.35)]" aria-hidden>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-xl">🧑‍💼</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{locale === "ka" ? "ნინო" : "Nino"}</p>
              <p className="text-xs text-muted"><span className="text-ok">●</span> {tcall("live")} · 01:24</p>
            </div>
            <span className="chip bg-accent/12 text-accent">{td("HARD")}</span>
          </div>
          <div className="flex h-10 items-center gap-[3px]">
            {[3, 6, 10, 7, 12, 16, 9, 14, 20, 13, 8, 17, 22, 15, 10, 6, 12, 18, 11, 7, 4, 9, 14, 8, 5].map((h, i) => (
              <span key={i} className="w-1 flex-1 rounded-full bg-brand/70" style={{ height: `${h * 4}%` }} />
            ))}
          </div>
          <div className="space-y-2.5 text-sm">
            <p className="w-fit max-w-[85%] rounded-2xl rounded-tl-md bg-bg px-3.5 py-2">{t("mockAi")}</p>
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-md bg-brand px-3.5 py-2 text-brand-fg">{t("mockYou")}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <span className="text-2xl font-semibold tabular-nums text-ok">86</span>
            <div className="flex-1">
              <p className="text-xs font-medium">{t("mockScore")}</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-bg"><div className="h-full w-[86%] rounded-full bg-ok" /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="h1 text-center">{t("howTitle")}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card space-y-2">
              <span className="font-mono text-sm text-brand">0{n}</span>
              <h3 className="h2">{t(`step${n}Title`)}</h3>
              <p className="text-muted">{t(`step${n}Text`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid items-center gap-8 md:grid-cols-[1fr_1.3fr]">
        <div className="min-w-0 space-y-4">
          <h2 className="h1 text-balance break-words">{t("photoTitle")}</h2>
          <p className="text-lg text-muted text-pretty">{t("photoSub")}</p>
          <Link href="/courses" className="btn-primary inline-flex px-5 py-2.5">{tcommon("courses")} →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {([["/images/closer-desk.webp", t("photoCap1")], ["/images/closer-floor.webp", t("photoCap2")]] as const).map(([src, cap], i) => (
            <figure key={src} className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-fg ${i ? "mt-10" : ""}`}>
              <Image src={src} alt="" fill sizes="(max-width: 768px) 50vw, 340px" className="object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-12 text-sm font-semibold text-white">{cap}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="h1 text-center">{t("professionsTitle")}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {professions.map((p) => (
            <Link key={p.id} href={`/professions/${p.slug}`} className="card flex flex-col items-center gap-2 text-center transition hover:-translate-y-0.5 hover:border-fg/15 hover:shadow-[0_12px_32px_-16px_rgb(16_24_40/0.25)]">
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
