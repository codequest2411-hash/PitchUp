import { setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/AuthForm";
import { devLoginEnabled, firebaseWebConfig } from "@/lib/auth";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <AuthForm mode="register" firebase={firebaseWebConfig()} dev={devLoginEnabled()} />;
}
