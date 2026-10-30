import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("admin");
  const purchases = await db.purchase.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { user: true, course: true } });

  return (
    <div className="space-y-4">
      <h1 className="h1">{t("payments")}</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr><th className="p-3">{t("date")}</th><th className="p-3">{t("user")}</th><th className="p-3">{t("Course")}</th><th className="p-3 text-right">{t("amount")}</th></tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3">{p.createdAt.toISOString().slice(0, 10)}</td>
                <td className="p-3">{p.user.email}</td>
                <td className="p-3">{p.course?.titleEn ?? "Pro subscription"}</td>
                <td className="p-3 text-right tabular-nums">{(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
