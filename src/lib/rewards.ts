import type { User } from "@prisma/client";
import { db } from "./db";
import { levelFromXp, nextStreak } from "./levels";

export async function awardBadge(userId: string, badgeId: string) {
  await db.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    create: { userId, badgeId },
    update: {},
  });
}

// Adds XP (+ daily streak bonus) and recomputes level. Returns total XP added.
export async function addXp(user: User, xp: number) {
  const { streakDays, bonusXp } = nextStreak(user.lastActiveAt, user.streakDays);
  const total = Math.max(0, user.xp + xp + bonusXp);
  await db.user.update({
    where: { id: user.id },
    data: { xp: total, level: levelFromXp(total), streakDays, lastActiveAt: new Date() },
  });
  if (streakDays >= 7) await awardBadge(user.id, "STREAK_7");
  return xp + bonusXp;
}
