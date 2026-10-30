import { createHash } from "crypto";
import type { Course, User } from "@prisma/client";
import { db } from "./db";
import { effectiveLevel } from "./levels";

export const FREE_CALLS_PER_DAY = 3;
export const GUEST_CALLS_PER_DAY = 1;
export const MAX_SEC = { guest: 120, free: 300, pro: 1200 };

export async function isPro(userId: string | undefined) {
  if (!userId) return false;
  const sub = await db.subscription.findFirst({
    where: { userId, status: { in: ["active", "trialing"] }, currentPeriodEnd: { gt: new Date() } },
  });
  return Boolean(sub);
}

export async function userContext(user: User | null) {
  const pro = user?.role === "ADMIN" || (await isPro(user?.id));
  return { pro, level: user ? effectiveLevel(user.xp, pro) : 1 };
}

export async function canAccessCourse(user: User | null, course: Course, pro: boolean) {
  if (course.isFree) return true;
  if (!user) return false;
  if (pro) return true;
  return Boolean(await db.purchase.findFirst({ where: { userId: user.id, courseId: course.id } }));
}

export const ipKey = (ip: string) => "ip:" + createHash("sha256").update(ip).digest("hex").slice(0, 32);
const today = () => new Date().toISOString().slice(0, 10);

export async function callsUsedToday(key: string) {
  const row = await db.dailyUsage.findUnique({ where: { key_date: { key, date: today() } } });
  return row?.callsUsed ?? 0;
}

// Atomically takes one call from today's quota; returns false if over the limit.
export async function consumeCall(key: string, limit: number) {
  const date = today();
  const row = await db.dailyUsage.upsert({
    where: { key_date: { key, date } },
    create: { key, date, callsUsed: 1 },
    update: { callsUsed: { increment: 1 } },
  });
  if (row.callsUsed <= limit) return true;
  await db.dailyUsage.update({ where: { key_date: { key, date } }, data: { callsUsed: { decrement: 1 } } });
  return false;
}
