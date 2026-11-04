import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
const { buildMemory, memoryForCustomer, memoryForCoach } = await import("@/lib/memory");

const day = 86_400_000, now = Date.UTC(2026, 10, 4);
const row = (scenarioId: string, daysAgo: number, score: number, sub: Record<string, number>, outcome = "LOST", improve: string[] = []) => ({
  scenarioId, startedAt: new Date(now - daysAgo * day), score, outcome, subScores: sub, feedback: { improve },
});
const sub = (o: number, d: number, v: number, ob: number, c: number, t: number) => ({ opening: o, discovery: d, value: v, objections: ob, closing: c, tone: t });

describe("memory", () => {
  it("is null with no scored calls", () => {
    expect(buildMemory([])).toBeNull();
  });

  it("averages skills, finds weak/strong, keeps recent tips and the last call with this customer", () => {
    const m = buildMemory([
      row("s1", 1, 60, sub(70, 40, 60, 30, 50, 80), "FOLLOW_UP", ["Ask more questions", "Handle price"]),
      row("s2", 3, 50, sub(60, 50, 50, 40, 40, 90), "LOST", ["Close earlier"]),
      row("s1", 10, 40, sub(50, 30, 40, 20, 30, 70)),
    ], "s1", now)!;
    expect(m.calls).toBe(3);
    expect(m.avgScore).toBe(50);
    expect(m.weak).toEqual(["objections", "discovery"]);
    expect(m.strong).toBe("tone");
    expect(m.recentTips).toEqual(["Ask more questions", "Handle price", "Close earlier"]);
    expect(m.lastWithCustomer).toEqual({ outcome: "FOLLOW_UP", score: 60, daysAgo: 1 });
    expect(memoryForCustomer(m)).toContain("yesterday");
    expect(memoryForCoach(m)).toContain("objections, discovery");
  });

  it("customer forgets calls older than 60 days", () => {
    const m = buildMemory([row("s1", 90, 50, sub(1, 1, 1, 1, 1, 1))], "s1", now);
    expect(memoryForCustomer(m)).toBe("");
  });
});
