import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { tr } from "@/lib/loc";
import { requireUser } from "@/lib/guard";
import { CheckoutButton } from "@/components/CheckoutButton";

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ success?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations("profile");
  const tp = await getTranslations("pricing");
  const tc = await getTranslations("common");
  const [sub, purchases] = await Promise.all([
    db.subscription.findFirst({ where: { userId: user.id }, orderBy: { currentPeriodEnd: "desc" } }),
    db.purchase.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { course: true } }),
  ]);
  const active = sub && ["active", "trialing"].includes(sub.status) && sub.currentPeriodEnd > new Date();
  const fmt = (d: Date) => d.toLocaleDateString(locale === "ka" ? "ka-GE" : "en-US");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="h1">{t("billing")}</h1>
      {(await searchParams).success && <p className="card text-ok">{t("success")}</p>}
      <div className="card space-y-3">
        <p><span className="text-muted">{t("plan")}:</span> <b>{active ? (sub.plan === "pro_yearly" ? tp("yearly") : tp("monthly")) : tc("free")}</b></p>
        {sub && (
          <>
            <p><span className="text-muted">{t("status")}:</span> {sub.status}</p>
            <p><span className="text-muted">{t("nextPayment")}:</span> {fmt(sub.currentPeriodEnd)}</p>
          </>
        )}
        {user.stripeCustomerId && <CheckoutButton endpoint="/api/billing/portal" className="btn-ghost">{t("manage")}</CheckoutButton>}
        {!active && <Link href="/pricing" className="btn-accent">{t("upgrade")}</Link>}
      </div>
      <div className="card space-y-3">
        <h2 className="h2">{t("purchases")}</h2>
        {purchases.length ? (
          <ul className="divide-y divide-line">
            {purchases.map((p) => (
              <li key={p.id} className="flex justify-between py-2 text-sm">
                <span>{p.course ? tr(p.course, "title", locale) : "PitchUp Pro"}</span>
                <span className="tabular-nums">{fmt(p.createdAt)} · {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{t("noPurchases")}</p>
        )}
      </div>
    </div>
  );
}
