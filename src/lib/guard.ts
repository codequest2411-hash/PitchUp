import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getUser, isAdmin } from "./auth";

export async function requireUser(locale: string) {
  const user = await getUser();
  if (!user) return redirect({ href: "/login", locale });
  return user;
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user || !isAdmin(user)) notFound();
  return user;
}
