import type { Metadata } from "next";
import { Geist, Noto_Sans_Georgian } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "../globals.css";

const CLIENT_NAMESPACES = ["common", "auth", "practice", "difficulty", "lesson", "call"];
const pick = (m: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.map((k) => [k, m[k]]));

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const georgian = Noto_Sans_Georgian({ subsets: ["georgian"], variable: "--font-georgian" });

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "common" });
  return { title: { default: `${t("appName")} — ${t("tagline")}`, template: `%s · ${t("appName")}` }, description: t("tagline") };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body className={`${geist.variable} ${georgian.variable} flex min-h-screen flex-col font-sans antialiased`}>
        {/* Only the namespaces client components use, instead of every translation on every page. */}
        <NextIntlClientProvider messages={pick(await getMessages(), CLIENT_NAMESPACES)}>
          <Header locale={locale} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
