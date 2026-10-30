import { z } from "zod";

export type Line = { role: "user" | "ai"; text: string };
export const SKILLS = ["opening", "discovery", "value", "objections", "closing", "tone"] as const;
export type Skill = (typeof SKILLS)[number];

const n = z.coerce.number().transform((v) => Math.max(0, Math.min(100, Math.round(v))));

export const ScoreSchema = z.object({
  score: n,
  outcome: z.enum(["SOLD", "FOLLOW_UP", "LOST"]),
  subScores: z.object({ opening: n, discovery: n, value: n, objections: n, closing: n, tone: n }),
  wellDone: z.array(z.string()).max(3),
  improve: z.array(z.string()).max(3),
  rewrite: z.string(),
});
export type Score = z.infer<typeof ScoreSchema>;

// LLMs sometimes wrap JSON in ```json fences or add text around it.
export function parseScore(raw: string): Score {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON object in scoring response");
  return ScoreSchema.parse(JSON.parse(raw.slice(start, end + 1)));
}

// shortcut: keyword heuristic used only when no GEMINI_API_KEY is set (local dev), not a real evaluation.
export function heuristicScore(transcript: Line[], locale: string): Score {
  const mine = transcript.filter((l) => l.role === "user").map((l) => l.text.toLowerCase());
  const text = mine.join(" ");
  const has = (...w: string[]) => w.some((x) => text.includes(x));
  const subScores = {
    opening: mine.length ? 60 : 0,
    discovery: Math.min(100, 30 + (text.match(/\?/g)?.length ?? 0) * 15),
    value: has("value", "save", "benefit", "ღირებულ", "დაზოგ", "სარგებ") ? 75 : 40,
    objections: has("understand", "მესმის", "გასაგებია") ? 70 : 35,
    closing: has("deal", "sign", "buy", "start", "შევთანხმდეთ", "დავიწყოთ", "იყიდ") ? 75 : 30,
    tone: Math.min(100, 40 + mine.length * 8),
  };
  const score = mine.length
    ? Math.round(Object.values(subScores).reduce((a, b) => a + b, 0) / SKILLS.length)
    : 0;
  const ka = locale === "ka";
  return {
    score,
    subScores,
    outcome: score >= 70 ? "SOLD" : score >= 50 ? "FOLLOW_UP" : "LOST",
    wellDone: [ka ? "ზარი დაიწყე და საუბარი გააგრძელე." : "You started the call and kept the conversation going."],
    improve: [
      ka ? "დასვი მეტი ღია კითხვა მომხმარებლის საჭიროებებზე." : "Ask more open questions about the customer's needs.",
      ka ? "ბოლოს პირდაპირ შესთავაზე შემდეგი ნაბიჯი." : "End by proposing a clear next step.",
    ],
    rewrite: ka
      ? "„რა არის ახლა თქვენთვის ყველაზე დიდი გამოწვევა ამ საკითხში?“"
      : "\"What is the biggest challenge for you with this right now?\"",
  };
}
