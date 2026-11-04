import type { Difficulty } from "@prisma/client";

// XP needed to reach level N is LEVELS[N-1]. Levels 1-10 are hand-tuned; 11-100 each need 200 XP more than the step before.
const BASE = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 6000];
export const MAX_LEVEL = 100;
export const LEVELS = Array.from({ length: MAX_LEVEL - BASE.length }).reduce<number[]>(
  (acc, _, k) => [...acc, acc[acc.length - 1] + 1800 + 200 * (k + 1)],
  BASE,
);
export const FREE_MAX_LEVEL = 3;
export const HINT_COST = 5;
export const DIFFICULTY_MIN_LEVEL: Record<Difficulty, number> = { EASY: 1, NORMAL: 1, HARD: 3, BOSS: 5 };
const MULT: Record<Difficulty, number> = { EASY: 1, NORMAL: 1.5, HARD: 2, BOSS: 3 };

export function levelFromXp(xp: number) {
  let lvl = 1;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) lvl = i + 1;
  return lvl;
}

export const effectiveLevel = (xp: number, pro: boolean) =>
  pro ? levelFromXp(xp) : Math.min(levelFromXp(xp), FREE_MAX_LEVEL);

export function levelProgress(xp: number) {
  const lvl = levelFromXp(xp);
  const from = LEVELS[lvl - 1];
  const to = LEVELS[lvl] ?? from;
  return { lvl, from, to, pct: to === from ? 100 : Math.round(((xp - from) / (to - from)) * 100) };
}

export function callXp(score: number, difficulty: Difficulty, sold: boolean) {
  return Math.round((score / 2) * MULT[difficulty]) + (sold ? 20 : 0);
}

const day = (d: Date) => d.toISOString().slice(0, 10);

// Returns the new streak and bonus XP for activity at `now`.
export function nextStreak(last: Date | null, streak: number, now = new Date()) {
  if (last && day(last) === day(now)) return { streakDays: streak, bonusXp: 0 };
  const yesterday = new Date(now.getTime() - 86400000);
  if (last && day(last) === day(yesterday)) return { streakDays: streak + 1, bonusXp: 5 };
  return { streakDays: 1, bonusXp: 0 };
}
