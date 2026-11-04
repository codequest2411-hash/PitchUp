import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getProfessions } from "@/lib/catalog";
import { tr } from "@/lib/loc";

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ profession?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { profession } = await searchParams;
  const t = await getTranslations("leaderboard");
  const tc = await getTranslations("common");
  const professions = await getProfessions();

  const rows = await db.call.groupBy({
    by: ["userId"],
    where: {
      startedAt: { gte: new Date(Date.now() - 7 * 86400000) },
      xpEarned: { gt: 0 },
      user: { leaderboardOptOut: false, banned: false },
      scenario: profession ? { profession: { slug: profession } } : undefined,
    },
    _sum: { xpEarned: true },
    orderBy: { _sum: { xpEarned: "desc" } },
    take: 50,
  });
  const users = await db.user.findMany({ where: { id: { in: rows.map((r) => r.userId!) } }, select: { id: true, name: true, level: true } });
  const byId = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="h1">{t("title")}</h1>
        <p className="text-muted">{t("subtitle")}</p>
      </div>
      <form className="flex gap-2">
        <label htmlFor="profession" className="sr-only">{tc("professions")}</label>
        <select id="profession" name="profession" defaultValue={profession ?? ""} className="input">
          <option value="">{t("allProfessions")}</option>
          {professions.map((p) => <option key={p.id} value={p.slug}>{tr(p, "title", locale)}</option>)}
        </select>
        <button className="btn-primary">{tc("open")}</button>
      </form>
      {rows.length ? (
        <table className="card w-full text-left">
          <thead className="text-sm text-muted">
            <tr><th className="p-2">{t("rank")}</th><th className="p-2">{t("user")}</th><th className="p-2 text-right">{t("xp")}</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.userId} className="border-t border-line">
                <td className="p-2 font-bold">{["🥇", "🥈", "🥉"][i] ?? i + 1}</td>
                <td className="p-2">{byId.get(r.userId!)?.name ?? "—"} <span className="text-xs text-muted">{tc("level", { level: byId.get(r.userId!)?.level ?? 1 })}</span></td>
                <td className="p-2 text-right font-bold tabular-nums">{r._sum.xpEarned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="card text-muted">{t("empty")}</p>
      )}
    </div>
  );
}
