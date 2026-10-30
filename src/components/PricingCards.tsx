import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PLANS, type Currency } from "@/lib/payments";
import { CheckoutButton } from "./CheckoutButton";

export async function PricingCards({ currency = "gel", loggedIn, pro }: { currency?: Currency; loggedIn: boolean; pro: boolean }) {
  const t = await getTranslations("pricing");
  const sym = currency === "gel" ? "₾" : "$";
  const plans = [
    { id: "free", name: t("free"), price: `${sym}0`, per: "", features: [t("fFree1"), t("fFree2"), t("fFree3")], hint: t("freeDesc") },
    { id: "pro_monthly", name: t("monthly"), price: `${sym}${PLANS.pro_monthly[currency]}`, per: t("perMonth"), features: [t("fPro1"), t("fPro2"), t("fPro3"), t("fPro4")] },
    { id: "pro_yearly", name: t("yearly"), price: `${sym}${PLANS.pro_yearly[currency]}`, per: t("perYear"), features: [t("fPro1"), t("fPro2"), t("fPro3"), t("fPro4")], hint: t("save"), best: true },
  ] as const;

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {plans.map((p) => (
        <div key={p.id} className={`card flex flex-col gap-4 ${"best" in p ? "ring-2 ring-accent" : ""}`}>
          <div className="flex items-center justify-between">
            <h3 className="h2">{p.name}</h3>
            {"hint" in p && <span className={`chip ${"best" in p ? "bg-accent text-white" : "bg-bg text-muted"}`}>{p.hint}</span>}
          </div>
          <p><span className="text-4xl font-extrabold">{p.price}</span> <span className="text-muted">{p.per}</span></p>
          <ul className="flex-1 space-y-2 text-sm">
            {p.features.map((f) => <li key={f} className="flex gap-2"><span className="text-ok">✓</span>{f}</li>)}
          </ul>
          {p.id === "free" ? (
            <Link href={loggedIn ? "/practice" : "/register"} className="btn-ghost">{loggedIn ? (pro ? t("choose") : t("current")) : t("choose")}</Link>
          ) : pro ? (
            <Link href="/profile/billing" className="btn-ghost">{t("current")}</Link>
          ) : loggedIn ? (
            <CheckoutButton body={{ kind: "plan", plan: p.id, currency }} className={"best" in p ? "btn-accent" : "btn-primary"}>{t("choose")}</CheckoutButton>
          ) : (
            <Link href="/register" className={"best" in p ? "btn-accent" : "btn-primary"}>{t("choose")}</Link>
          )}
        </div>
      ))}
    </div>
  );
}
