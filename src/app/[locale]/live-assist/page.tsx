import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getUser } from "@/lib/auth";
import { LIVE_ASSIST_PER_DAY, userContext } from "@/lib/access";
import { LiveAssistClient } from "@/components/LiveAssistClient";

export async function generateMetadata() {
  return { title: { absolute: "PitchUp Live" } };
}

// Shown inside the small always-on-top PitchUp Live desktop window (also works in Chrome).
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("assist");
  const user = await getUser();
  const other = locale === "ka" ? "en" : "ka";
  return (
    <div className="mx-auto max-w-md space-y-3">
      {/* The overlay window is tiny: hide the site header/footer on this page only. */}
      <style>{"body>div>header,body header,body footer{display:none}main{padding-top:12px!important}"}</style>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">PitchUp Live</h1>
        <Link href="/live-assist" locale={other} className="text-xs font-semibold text-muted hover:text-fg">{other === "ka" ? "ქართული" : "English"}</Link>
      </div>
      {user ? (
        <LiveAssistClient pro={(await userContext(user)).pro} freeLimit={LIVE_ASSIST_PER_DAY.free} />
      ) : (
        <div className="card space-y-3">
          <p className="text-sm text-muted">{t("loginText")}</p>
          <Link href={{ pathname: "/login", query: { next: "/live-assist" } }} className="btn-primary w-full">{t("login")}</Link>
          <Link href={{ pathname: "/register", query: { next: "/live-assist" } }} className="btn-ghost w-full">{t("register")}</Link>
        </div>
      )}
    </div>
  );
}
