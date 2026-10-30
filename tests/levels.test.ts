import { describe, expect, it } from "vitest";
import { callXp, effectiveLevel, levelFromXp, levelProgress, nextStreak } from "@/lib/levels";

describe("levels", () => {
  it("maps XP to levels at the thresholds", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(6000)).toBe(10);
    expect(levelFromXp(99999)).toBe(10);
  });

  it("caps free users at level 3", () => {
    expect(effectiveLevel(5000, false)).toBe(3);
    expect(effectiveLevel(5000, true)).toBe(9);
  });

  it("reports progress inside a level", () => {
    expect(levelProgress(175)).toMatchObject({ lvl: 2, from: 100, to: 250, pct: 50 });
    expect(levelProgress(7000).pct).toBe(100);
  });

  it("scales call XP by difficulty and sale", () => {
    expect(callXp(80, "EASY", false)).toBe(40);
    expect(callXp(80, "BOSS", true)).toBe(140);
  });

  it("tracks daily streaks", () => {
    const now = new Date("2026-10-30T12:00:00Z");
    expect(nextStreak(null, 0, now)).toEqual({ streakDays: 1, bonusXp: 0 });
    expect(nextStreak(new Date("2026-10-30T08:00:00Z"), 4, now)).toEqual({ streakDays: 4, bonusXp: 0 });
    expect(nextStreak(new Date("2026-10-29T20:00:00Z"), 4, now)).toEqual({ streakDays: 5, bonusXp: 5 });
    expect(nextStreak(new Date("2026-10-27T20:00:00Z"), 4, now)).toEqual({ streakDays: 1, bonusXp: 0 });
  });
});
