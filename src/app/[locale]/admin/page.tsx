import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("admin");
  const [users, calls, courses, activeSubs, revenue] = await Promise.all([
    db.user.count(),
    db.call.count(),
    db.course.count(),
    db.subscription.count({ where: { status: "active" } }),
    db.purchase.groupBy({ by: ["currency"], _sum: { amount: true } }),
  ]);
  const stats = [
    [t("users"), users],
    [t("calls"), calls],
    [t("Course"), courses],
    ["Pro", activeSubs],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="h1">{t("title")}</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label} className="card">
            <p className="text-sm text-muted">{label}</p>
            <p className="text-3xl font-extrabold tabular-nums">{n}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="h2">{t("revenue")}</h2>
        {revenue.length ? revenue.map((r) => (
          <p key={r.currency} className="text-2xl font-bold tabular-nums">{((r._sum.amount ?? 0) / 100).toFixed(2)} {r.currency.toUpperCase()}</p>
        )) : <p className="text-muted">0</p>}
      </div>
    </div>
  );
}
