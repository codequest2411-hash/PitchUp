import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("admin");
  const calls = await db.call.findMany({ orderBy: { startedAt: "desc" }, take: 200, include: { user: true, scenario: { include: { profession: true } } } });

  return (
    <div className="space-y-4">
      <h1 className="h1">{t("calls")}</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr><th className="p-3">{t("date")}</th><th className="p-3">{t("user")}</th><th className="p-3">{t("Scenario")}</th><th className="p-3">{t("score")}</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="p-3">{c.startedAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                <td className="p-3">{c.user?.email ?? "guest"}</td>
                <td className="p-3">{c.scenario.profession.icon} {c.scenario.customerName} · {c.difficulty} · {c.mode} · {c.locale}</td>
                <td className="p-3 tabular-nums">{c.score ?? "—"} {c.outcome ?? ""}</td>
                <td className="p-3">{c.endedAt && <Link href={`/results/${c.id}`} className="btn-ghost px-3 py-1.5">{t("view")}</Link>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
