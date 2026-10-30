import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "./db";
import { adminAuth } from "./firebase-admin";

export const SESSION_COOKIE = "session";

// Dev login only works locally when Firebase is not configured. Never in production.
export const devLoginEnabled = () =>
  process.env.NODE_ENV !== "production" && !process.env.FIREBASE_SERVICE_ACCOUNT;

export async function uidFromSession(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("dev:")) return devLoginEnabled() ? value : null;
  try {
    return (await adminAuth().verifySessionCookie(value, true)).uid;
  } catch {
    return null;
  }
}

export const getUser = cache(async () => {
  const uid = await uidFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const user = await db.user.findUnique({ where: { firebaseUid: uid } });
  return user && !user.banned ? user : null;
});

// Public Firebase web config (not secret), passed to the login form.
export function firebaseWebConfig() {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    appId: process.env.FIREBASE_APP_ID,
  };
}

export function isAdminEmail(email?: string | null) {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  return Boolean(email && list.includes(email.toLowerCase()));
}
