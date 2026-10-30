import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("common");
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-6 text-sm text-muted">
        <span>© {new Date().getFullYear()} {t("appName")}. {t("rights")}</span>
        <span className="flex-1" />
        <Link href="/privacy" className="hover:text-fg">{t("privacy")}</Link>
        <Link href="/terms" className="hover:text-fg">{t("terms")}</Link>
      </div>
    </footer>
  );
}
