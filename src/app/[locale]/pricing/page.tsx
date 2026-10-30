import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getUser } from "@/lib/auth";
import { isPro } from "@/lib/access";
import { PricingCards } from "@/components/PricingCards";

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ currency?: string; canceled?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("pricing");
  const user = await getUser();
  const currency = sp.currency === "usd" || sp.currency === "gel" ? sp.currency : locale === "ka" ? "gel" : "usd";

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="h1">{t("title")}</h1>
        <p className="text-muted">{t("subtitle")}</p>
      </div>
      {sp.canceled && <p className="card text-center text-muted">{t("canceled")}</p>}
      <div className="flex items-center justify-center gap-2 text-sm" role="group" aria-label={t("currency")}>
        <span className="text-muted">{t("currency")}:</span>
        {(["gel", "usd"] as const).map((c) => (
          <Link key={c} href={`/pricing?currency=${c}`} aria-current={c === currency} className={c === currency ? "btn-primary px-3 py-1.5" : "btn-ghost px-3 py-1.5"}>
            {c === "gel" ? "₾ GEL" : "$ USD"}
          </Link>
        ))}
      </div>
      <PricingCards currency={currency} loggedIn={Boolean(user)} pro={await isPro(user?.id)} />
      <p className="text-center text-sm text-muted">{t("courseNote")}</p>
    </div>
  );
}
