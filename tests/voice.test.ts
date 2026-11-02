import { describe, expect, it } from "vitest";
import { isMaleName, voiceFor } from "@/lib/ai";

describe("voiceFor", () => {
  it("gives male names a male voice, in Georgian and Latin spelling", () => {
    for (const n of ["ნიკა", "ლუკა", "ბექა", "გიორგი", "Nika", "nika", "Giorgi Beridze"]) expect(voiceFor(n)).toBe("Charon");
  });
  it("gives female and unknown names a female voice", () => {
    for (const n of ["ნინო", "ანა", "ეკა", "ლიკა", "Mariam", "Zoe"]) expect(voiceFor(n)).toBe("Kore");
    expect(isMaleName("  ")).toBe(false);
  });
});
