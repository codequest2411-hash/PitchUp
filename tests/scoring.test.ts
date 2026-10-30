import { describe, expect, it } from "vitest";
import { heuristicScore, parseScore } from "@/lib/scoring";

const valid = {
  score: 72.4,
  outcome: "FOLLOW_UP",
  subScores: { opening: 80, discovery: 60, value: 70, objections: 150, closing: -5, tone: "75" },
  wellDone: ["a", "b", "c"],
  improve: ["x", "y", "z"],
  rewrite: "better line",
};

describe("parseScore", () => {
  it("parses JSON wrapped in code fences and clamps numbers to 0-100", () => {
    const s = parseScore("Here you go:\n```json\n" + JSON.stringify(valid) + "\n```");
    expect(s.score).toBe(72);
    expect(s.subScores.objections).toBe(100);
    expect(s.subScores.closing).toBe(0);
    expect(s.subScores.tone).toBe(75);
  });

  it("rejects bad outcomes and missing JSON", () => {
    expect(() => parseScore(JSON.stringify({ ...valid, outcome: "MAYBE" }))).toThrow();
    expect(() => parseScore("no json here")).toThrow();
  });
});

describe("heuristicScore", () => {
  it("gives 0 and LOST for an empty call", () => {
    expect(heuristicScore([], "en")).toMatchObject({ score: 0, outcome: "LOST" });
  });
  it("rewards questions and closing language", () => {
    const s = heuristicScore([
      { role: "user", text: "Hi! What is your biggest challenge? How do you handle it now?" },
      { role: "ai", text: "It's expensive." },
      { role: "user", text: "I understand. It will save you time — shall we start the deal today?" },
    ], "en");
    expect(s.score).toBeGreaterThan(50);
  });
});
