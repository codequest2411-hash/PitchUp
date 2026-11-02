import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionCookie, devLoginEnabled, isAdminEmail, SESSION_COOKIE, SESSION_MAX_AGE, verifySupabaseToken } from "@/lib/auth";

const Body = z.union([
  z.object({ accessToken: z.string().min(10), name: z.string().max(80).optional() }),
  z.object({ dev: z.enum(["student", "admin"]) }),
]);

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const body = parsed.data;

  let uid: string, cookie: string, email: string | undefined, name: string | undefined, avatarUrl: string | undefined;
  if ("dev" in body) {
    if (!devLoginEnabled()) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    uid = cookie = `dev:${body.dev}`;
    email = `${body.dev}@pitchup.local`;
    name = body.dev === "admin" ? "Demo Admin" : "Demo Student";
  } else {
    const su = await verifySupabaseToken(body.accessToken);
    if (!su) return NextResponse.json({ error: "invalid token" }, { status: 401 });
    uid = su.id;
    email = su.email;
    name = body.name || su.user_metadata?.full_name || su.user_metadata?.name;
    avatarUrl = su.user_metadata?.avatar_url;
    cookie = createSessionCookie(uid);
    // Carry over accounts made with the old Firebase login, but only for a verified email.
    if (email && su.email_confirmed_at && !(await db.user.findUnique({ where: { firebaseUid: uid } }))) {
      const old = await db.user.findFirst({ where: { email, NOT: { firebaseUid: { startsWith: "dev:" } } } });
      if (old) await db.user.update({ where: { id: old.id }, data: { firebaseUid: uid } });
    }
  }

  const admin = ("dev" in body && body.dev === "admin") || isAdminEmail(email);
  const user = await db.user.upsert({
    where: { firebaseUid: uid },
    create: { firebaseUid: uid, email, name: name ?? email?.split("@")[0], avatarUrl, role: admin ? "ADMIN" : "STUDENT" },
    update: { email, ...(avatarUrl ? { avatarUrl } : {}), ...(admin ? { role: "ADMIN" as const } : {}) },
  });
  if (user.banned) return NextResponse.json({ error: "banned" }, { status: 403 });

  const res = NextResponse.json({ ok: true, locale: user.locale });
  res.cookies.set(SESSION_COOKIE, cookie, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
