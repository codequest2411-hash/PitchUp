import { setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/AuthForm";
import { devLoginEnabled, supabaseWebConfig } from "@/lib/auth";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <AuthForm mode="login" config={await supabaseWebConfig()} dev={devLoginEnabled()} />;
}
