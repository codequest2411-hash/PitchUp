import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/guard";
import { ENTITIES } from "@/lib/admin-config";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const t = await getTranslations("admin");
  const links: [string, string][] = [
    ["/admin", t("title")],
    ["/admin/users", t("users")],
    ["/admin/payments", t("payments")],
    ["/admin/calls", t("calls")],
    ...Object.keys(ENTITIES).map((m): [string, string] => [`/admin/${m}`, t(m)]),
  ];
  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <nav className="card h-fit space-y-1 p-3 text-sm" aria-label={t("title")}>
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="block rounded-lg px-3 py-2 hover:bg-bg">{label}</Link>
        ))}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
