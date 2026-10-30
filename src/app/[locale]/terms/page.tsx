import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("legal");
  return (
    <article className="card mx-auto max-w-3xl space-y-4">
      <h1 className="h1">{t("termsTitle")}</h1>
      <p className="leading-relaxed text-muted">{t("termsBody")}</p>
    </article>
  );
}
