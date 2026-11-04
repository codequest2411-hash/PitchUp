import { describe, expect, it } from "vitest";
const { parseLesson } = await import("@/lib/lesson-format");
const { CORE } = await import("../prisma/core-courses");

describe("parseLesson", () => {
  it("groups headings, bullets, takeaways and say/avoid phrases", () => {
    const b = parseLesson("Intro\n## Head\n- a\n- b\nSAY: yes\nAVOID: no\nSAY: also\n> key\n> more");
    expect(b).toEqual([
      { k: "p", text: "Intro" }, { k: "h", text: "Head" }, { k: "ul", items: ["a", "b"] },
      { k: "say", good: ["yes", "also"], bad: ["no"] }, { k: "tip", items: ["key", "more"] },
    ]);
  });

  it("every core course has 3 lessons with a takeaway, phrases and a valid 5-question quiz", () => {
    for (const [key, c] of Object.entries(CORE)) {
      expect(c.lessons, key).toHaveLength(3);
      expect(c.quiz, key).toHaveLength(5);
      for (const x of c.quiz) expect(x.o[x.c], key).toBeDefined();
      for (const lang of ["en", "ka"] as const) {
        const kinds = c.lessons.flatMap((l) => parseLesson(l.body[lang]).map((b) => b.k));
        expect(kinds, `${key} ${lang}`).toContain("tip");
        expect(kinds, `${key} ${lang}`).toContain("say");
      }
    }
  });
});
