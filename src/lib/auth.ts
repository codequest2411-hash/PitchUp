import crypto from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "./db";

// Auth is Supabase Auth. After login the server verifies the Supabase access token once and
// sets its own HMAC-signed cookie "<supabaseUserId>.<expiresMs>.<sig>", so pages need no Supabase call.
// The User.firebaseUid column keeps its old name and now holds the Supabase user id.
export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Dev login only works locally when Supabase Auth is not configured. Never in production.
export const devLoginEnabled = () => process.env.NODE_ENV !== "production" && !process.env.SUPABASE_URL;

const sign = (payload: string) => crypto.createHmac("sha256", process.env.SESSION_SECRET!).update(payload).digest("base64url");

export function createSessionCookie(uid: string) {
  const payload = `${uid}.${Date.now() + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export async function uidFromSession(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("dev:")) return devLoginEnabled() ? value : null;
  if (!process.env.SESSION_SECRET) return null;
  const [uid, exp, sig] = value.split(".");
  if (!uid || !exp || !sig) return null;
  const expected = Buffer.from(sign(`${uid}.${exp}`));
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), expected)) return null;
  return Number(exp) > Date.now() ? uid : null;
}

export const getUser = cache(async () => {
  const uid = await uidFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const user = await db.user.findUnique({ where: { firebaseUid: uid } });
  return user && !user.banned ? user : null;
});

const supabaseFetch = (path: string, init: RequestInit = {}, key = process.env.SUPABASE_ANON_KEY!) =>
  fetch(`${process.env.SUPABASE_URL}/auth/v1${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, ...init.headers } });

// Public Supabase config (URL + anon key are not secret), passed to the login form.
export async function supabaseWebConfig() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;
  // Only show the Google button once the provider is switched on in the Supabase dashboard.
  const settings = await supabaseFetch("/settings", { next: { revalidate: 300 } } as RequestInit).then((r) => r.json()).catch(() => null);
  return { url: process.env.SUPABASE_URL, anonKey: process.env.SUPABASE_ANON_KEY, google: Boolean(settings?.external?.google) };
}
export type SupabaseWebConfig = NonNullable<Awaited<ReturnType<typeof supabaseWebConfig>>>;

export type SupabaseUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string;
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string };
};

export async function verifySupabaseToken(accessToken: string): Promise<SupabaseUser | null> {
  const res = await supabaseFetch("/user", { headers: { Authorization: `Bearer ${accessToken}` } });
  return res.ok ? res.json() : null;
}

// Needs the service-role key; without it the Supabase login stays but all PitchUp data is deleted.
export async function deleteSupabaseUser(uid: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key && !uid.startsWith("dev:")) await supabaseFetch(`/admin/users/${uid}`, { method: "DELETE" }, key).catch(() => {});
}

// Admin access comes only from ADMIN_EMAILS; the stored role just mirrors it.
export const isAdmin = (user?: { email: string | null } | null) => isAdminEmail(user?.email);

export function isAdminEmail(email?: string | null) {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  return Boolean(email && list.includes(email.toLowerCase()));
}
