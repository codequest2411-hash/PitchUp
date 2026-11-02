// AI-graded check of the AI customer. An AI seller plays a few calls against the real persona prompt
// (customerReply + personaPrompt), then a judge model grades realism and proposes prompt fixes.
// Run: npm run eval:customer -- [calls=4] [ka|en]   (needs GEMINI_API_KEY and DATABASE_URL in .env)
import { GoogleGenAI, Type } from "@google/genai";
import { PrismaClient } from "@prisma/client";
import { customerReply, personaPrompt } from "../src/lib/ai";
import type { Line } from "../src/lib/scoring";

const MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.5-flash";
const TURNS = 6;
const [calls = 4, locale = "ka"] = [Number(process.argv[2]) || undefined, process.argv[3]];
const lang = locale === "ka" ? "Georgian" : "English";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const db = new PrismaClient();
const fmt = (t: Line[]) => t.map((l) => `${l.role === "user" ? "SELLER" : "CUSTOMER"}: ${l.text}`).join("\n");

async function sellerLine(product: string, t: Line[]) {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `You are an average salesperson selling ${product} by phone. Call so far:\n${fmt(t) || "(you just dialed)"}\n\nSay your next line only (1-2 spoken sentences, ${lang}). Sometimes be pushy or vague, like a real beginner.`,
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  return res.text?.trim() ?? "";
}

const n = { type: Type.NUMBER };
const JUDGE = {
  type: Type.OBJECT,
  required: ["realism", "brevity", "inCharacter", "objections", "language", "issues", "promptFix"],
  properties: { realism: n, brevity: n, inCharacter: n, objections: n, language: n, issues: { type: Type.ARRAY, items: { type: Type.STRING } }, promptFix: { type: Type.STRING } },
};

async function judge(persona: string, t: Line[]) {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `You audit an AI that plays a CUSTOMER in sales-call training. Its instructions:\n${persona}\n\nTranscript:\n${fmt(t)}\n\nScore the CUSTOMER 1-10 on: realism (sounds like a real person on the phone), brevity (short spoken turns), inCharacter (never assistant-like, never helps the seller), objections (realistic, consistent pushback), language (natural ${lang}, correct grammar and gender). issues: concrete problems with quotes. promptFix: one instruction to add to its prompt that would fix the biggest problem.`,
    config: { responseMimeType: "application/json", responseSchema: JUDGE, thinkingConfig: { thinkingBudget: 0 } },
  });
  return JSON.parse(res.text ?? "{}");
}

async function main() {
  const scenarios = (await db.scenario.findMany({ include: { profession: true } })).sort(() => Math.random() - 0.5).slice(0, calls);
  const totals: Record<string, number[]> = {};
  for (const s of scenarios) {
    const persona = personaPrompt(s, "NORMAL", locale);
    const t: Line[] = [];
    for (let i = 0; i < TURNS; i++) {
      t.push({ role: "user", text: await sellerLine(s.profession.titleEn, t) });
      t.push({ role: "ai", text: await customerReply(persona, t, locale) });
    }
    const r = await judge(persona, t);
    console.log(`\n=== ${s.customerName} (${s.profession.titleEn}) ===\n${fmt(t)}`);
    console.log(`scores: realism ${r.realism} · brevity ${r.brevity} · inCharacter ${r.inCharacter} · objections ${r.objections} · language ${r.language}`);
    for (const i of r.issues ?? []) console.log(`  - ${i}`);
    console.log(`  fix: ${r.promptFix}`);
    for (const k of ["realism", "brevity", "inCharacter", "objections", "language"]) (totals[k] ??= []).push(Number(r[k]) || 0);
  }
  console.log("\nAVERAGES:", Object.entries(totals).map(([k, v]) => `${k} ${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)}`).join(" · "));
}

main().finally(() => db.$disconnect());
