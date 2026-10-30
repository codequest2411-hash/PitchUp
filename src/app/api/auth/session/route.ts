import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminAuth } from "@/lib/firebase-admin";
import { devLoginEnabled, isAdminEmail, SESSION_COOKIE } from "@/lib/auth";

const Body = z.union([
  z.object({ idToken: z.string().min(10), name: z.string().max(80).optional() }),
  z.object({ dev: z.enum(["student", "admin"]) }),
]);
const MAX_AGE = 60 * 60 * 24 * 5; // 5 days, Firebase's max is 14

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
    try {
      const decoded = await adminAuth().verifyIdToken(body.idToken);
      uid = decoded.uid;
      email = decoded.email;
      name = body.name || decoded.name;
      avatarUrl = decoded.picture;
      cookie = await adminAuth().createSessionCookie(body.idToken, { expiresIn: MAX_AGE * 1000 });
    } catch {
      return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }
  }

  const admin = ("dev" in body && body.dev === "admin") || isAdminEmail(email);
  const user = await db.user.upsert({
    where: { firebaseUid: uid },
    create: { firebaseUid: uid, email, name: name ?? email?.split("@")[0], avatarUrl, role: admin ? "ADMIN" : "STUDENT" },
    update: { email, avatarUrl, ...(admin ? { role: "ADMIN" as const } : {}) },
  });
  if (user.banned) return NextResponse.json({ error: "banned" }, { status: 403 });

  const res = NextResponse.json({ ok: true, locale: user.locale });
  res.cookies.set(SESSION_COOKIE, cookie, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
