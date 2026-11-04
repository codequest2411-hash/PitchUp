import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Tier } from "@/lib/access";
import { PLANS, type Currency } from "@/lib/payments";
import { CheckoutButton } from "./CheckoutButton";

export async function PricingCards({ currency = "gel", loggedIn, tier }: { currency?: Currency; loggedIn: boolean; tier: Tier }) {
  const t = await getTranslations("pricing");
  const sym = currency === "gel" ? "₾" : "$";
  const paid = [
    { id: "pro", name: t("pro"), hint: t("proDesc"), features: [t("fPro1"), t("fPro2"), t("fPro3"), t("fPro4"), t("fPro5")] },
    { id: "ultra", name: t("ultra"), hint: t("ultraDesc"), features: [t("fUltra1"), t("fUltra2"), t("fUltra3")], dark: true },
  ] as const;

  return (
    <div className="grid gap-5 md:grid-cols-3">
      <div className="card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="h2">{t("free")}</h3>
          <span className="chip bg-bg text-muted">{t("freeDesc")}</span>
        </div>
        <p><span className="text-4xl font-extrabold">{sym}0</span></p>
        <ul className="flex-1 space-y-2 text-sm">
          {[t("fFree1"), t("fFree2"), t("fFree3")].map((f) => <li key={f} className="flex gap-2"><span className="text-ok">✓</span>{f}</li>)}
        </ul>
        <Link href={loggedIn ? "/practice" : "/register"} className="btn-ghost">{loggedIn && tier === "free" ? t("current") : t("choose")}</Link>
      </div>

      {paid.map((p) => {
        const monthly = PLANS[`${p.id}_monthly`][currency];
        const yearly = PLANS[`${p.id}_yearly`][currency];
        const dark = "dark" in p;
        // Plans are prepaid, so buying the plan you already have extends it.
        const label = tier === p.id ? t("extend") : t("choose");
        return (
          <div key={p.id} className={`card flex flex-col gap-4 ${dark ? "border-fg bg-fg text-bg shadow-[0_24px_48px_-24px_rgb(16_24_40/0.45)]" : "border-fg/80 ring-1 ring-fg/80"}`}>
            <div className="flex items-center justify-between">
              <h3 className="h2">{p.name}</h3>
              <span className={`chip ${dark ? "bg-accent text-white" : "bg-fg text-bg"}`}>{p.hint}</span>
            </div>
            <p>
              <span className="text-4xl font-extrabold">{sym}{monthly}</span> <span className={dark ? "text-bg/60" : "text-muted"}>{t("perMonth")}</span>
              <span className={`block text-sm ${dark ? "text-bg/60" : "text-muted"}`}>{t("payYearly", { price: `${sym}${yearly}` })}</span>
            </p>
            <ul className="flex-1 space-y-2 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-2"><span className={dark ? "text-accent" : "text-ok"}>✓</span>{f}</li>)}
            </ul>
            {loggedIn ? (
              <div className="grid gap-2">
                <CheckoutButton body={{ kind: "plan", plan: `${p.id}_monthly`, currency }} className={dark ? "btn bg-bg text-fg hover:opacity-90" : "btn-primary"}>
                  {label} · {t("payMonthly", { price: `${sym}${monthly}` })}
                </CheckoutButton>
                <CheckoutButton body={{ kind: "plan", plan: `${p.id}_yearly`, currency }} className={dark ? "btn border border-bg/25 text-bg hover:bg-bg/10" : "btn-ghost"}>
                  {label} · {sym}{yearly} {t("perYear")}
                </CheckoutButton>
              </div>
            ) : (
              <Link href="/register" className={dark ? "btn bg-bg text-fg hover:opacity-90" : "btn-primary"}>{t("choose")}</Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
