import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProfessionsWithScenarios } from "@/lib/catalog";
import { tr } from "@/lib/loc";
import { getUser } from "@/lib/auth";
import { callsUsedToday, FREE_CALLS_PER_DAY, userContext } from "@/lib/access";
import { DIFFICULTY_MIN_LEVEL } from "@/lib/levels";
import { PracticeForm } from "@/components/PracticeForm";

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ profession?: string; scenario?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("practice");
  const tc = await getTranslations("common");
  const user = await getUser();
  const { pro, level } = await userContext(user);
  const professions = await getProfessionsWithScenarios();
  const callsLeft = user && !pro ? Math.max(0, FREE_CALLS_PER_DAY - (await callsUsedToday(`user:${user.id}`))) : null;

  const preset = sp.scenario ? professions.find((p) => p.scenarios.some((s) => s.id === sp.scenario)) : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="h1">{t("title")}</h1>
        <p className="text-muted">{t("subtitle")}</p>
      </div>
      <p className="chip bg-accent/15 text-accent">
        {!user ? t("guestNote") : pro ? tc("unlimited") : tc("callsLeft", { n: callsLeft ?? 0 })}
      </p>
      <PracticeForm
        locale={locale}
        initialProfession={preset?.slug ?? sp.profession ?? professions[0]?.slug}
        initialScenario={sp.scenario}
        professions={professions.map((p) => ({
          slug: p.slug,
          title: tr(p, "title", locale),
          scenarios: p.scenarios.map((s) => ({
            id: s.id,
            title: `${s.customerName} — ${tr(s, "title", locale)}`,
            locked: s.requiredLevel > level || (s.isPro && !pro) || (!user && s.isPro),
          })),
        }))}
        difficulties={(["EASY", "NORMAL", "HARD", "BOSS"] as const).map((d) => ({
          id: d,
          locked: DIFFICULTY_MIN_LEVEL[d] > level || (d === "BOSS" && !pro),
        }))}
      />
    </div>
  );
}
