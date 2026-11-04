import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getUser, isAdmin } from "@/lib/auth";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function Header({ locale }: { locale: string }) {
  const t = await getTranslations("common");
  const user = await getUser();
  const links = [
    ["/practice", t("practice")],
    ["/courses", t("courses")],
    ["/professions", t("professions")],
    ["/leaderboard", t("leaderboard")],
    ["/pricing", t("pricing")],
  ] as const;

  const account = user ? (
    <>
      <Link href="/dashboard" className="btn-ghost">{t("dashboard")}</Link>
      {isAdmin(user) && <Link href="/admin" className="btn-ghost">{t("admin")}</Link>}
      {/* Avatar instead of the "Profile" word on desktop; the menu on small screens keeps the label. */}
      <Link href="/profile" className="flex items-center gap-2 rounded-full px-1 py-1 hover:bg-bg xl:p-0" title={t("profile")}>
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover ring-2 ring-line" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold uppercase text-brand-fg" aria-hidden>
            {(user.name ?? user.email ?? "?").trim().charAt(0)}
          </span>
        )}
        <span className="xl:sr-only">{t("profile")}</span>
      </Link>
    </>
  ) : (
    <>
      <Link href="/login" className="btn-ghost">{t("login")}</Link>
      <Link href="/register" className="btn-primary">{t("register")}</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0" aria-label={t("appName")}>
          <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Image src="/logo-mark.svg" alt="" width={30} height={30} priority />
            <span>Pitch<span className="text-brand">Up</span></span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 xl:flex">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-fg">{label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher current={locale} loggedIn={Boolean(user)} />
          <div className="hidden items-center gap-2 text-sm xl:flex">{account}</div>
          <details className="relative xl:hidden">
            <summary className="btn-ghost cursor-pointer list-none" aria-label={t("menu")}>☰</summary>
            <div className="absolute right-0 mt-2 flex w-56 flex-col gap-2 rounded-2xl border border-line bg-card p-3 text-sm shadow-lg">
              {links.map(([href, label]) => (
                <Link key={href} href={href} className="rounded-lg px-3 py-2 hover:bg-bg">{label}</Link>
              ))}
              <hr className="border-line" />
              {account}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
