import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/guard";
import { updateProfileAction } from "@/app/actions";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { LogoutButton } from "@/components/LogoutButton";

// shortcut: avatar comes from the Google account; custom avatar upload to Cloud Storage is not built yet.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations("profile");
  const tc = await getTranslations("common");
  const tp = await getTranslations("practice");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt="" width={64} height={64} className="rounded-full" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-brand-fg">{(user.name ?? "?")[0]}</span>
        )}
        <div className="flex-1">
          <h1 className="h1">{t("title")}</h1>
          <p className="text-muted">{user.email}</p>
        </div>
        <LogoutButton label={tc("logout")} />
      </div>

      <form action={updateProfileAction} className="card space-y-4">
        <div>
          <label className="label" htmlFor="name">{t("name")}</label>
          <input id="name" name="name" defaultValue={user.name ?? ""} required maxLength={80} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="locale">{t("language")}</label>
          <select id="locale" name="locale" defaultValue={user.locale} className="input">
            <option value="ka">{tp("ka")}</option>
            <option value="en">{tp("en")}</option>
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="optOut" defaultChecked={user.leaderboardOptOut} /> {t("optOut")}
        </label>
        <button className="btn-primary">{tc("save")}</button>
      </form>

      <Link href="/profile/billing" className="card flex items-center justify-between hover:shadow-md">
        <span className="font-semibold">💳 {t("billing")}</span>→
      </Link>

      <div className="card space-y-3">
        <h2 className="h2">{t("data")}</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/api/me/export" download className="btn-ghost">⬇️ {t("export")}</a>
          <DeleteAccountButton label={t("delete")} confirm={t("deleteConfirm")} />
        </div>
      </div>
    </div>
  );
}
