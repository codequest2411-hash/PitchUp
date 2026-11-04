import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { UserActions } from "@/components/admin/UserActions";

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  setRequestLocale((await params).locale);
  const { q } = await searchParams;
  const t = await getTranslations("admin");
  const me = await getUser();
  const users = await db.user.findMany({
    where: q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    // Same rule as planTier: only unexpired subscriptions count, Ultra wins over Pro.
    include: { subscriptions: { where: { status: { in: ["active", "trialing"] }, currentPeriodEnd: { gt: new Date() } }, select: { plan: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="h1">{t("users")}</h1>
      <form><input name="q" defaultValue={q} placeholder="email / name" aria-label="search" className="input max-w-sm" /></form>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr><th className="p-3">{t("user")}</th><th className="p-3">{t("role")}</th><th className="p-3">{t("plan")}</th><th className="p-3">XP</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-t border-line ${u.banned ? "opacity-50" : ""}`}>
                <td className="p-3">{u.name}<br /><span className="text-xs text-muted">{u.email}</span></td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.subscriptions.some((s) => s.plan.startsWith("ultra")) ? "Ultra" : u.subscriptions.length ? "Pro" : "Free"}</td>
                <td className="p-3 tabular-nums">{u.xp} (L{u.level})</td>
                <td className="p-3">
                  {u.id !== me?.id && (
                    <UserActions id={u.id} banned={u.banned} labels={{ ban: t("ban"), unban: t("unban") }} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
