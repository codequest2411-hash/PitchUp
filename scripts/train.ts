// Self-play "training" run: AI sellers with different styles call the real AI customer (text mode),
// the live coach suggests lines, and a judge grades customer realism, coach quality and hang-up behaviour.
// Results go to a JSONL file for prompt tuning. Run: TRAIN_RPM=4 tsx --env-file=.env scripts/train.ts <minutes> <out.jsonl>
import { appendFileSync } from "node:fs";
import { GoogleGenAI, Type } from "@google/genai";
import { PrismaClient, type Difficulty } from "@prisma/client";
import { coachHint, customerReply, HANGUP_MARK, personaPrompt } from "../src/lib/ai";
import type { Line } from "../src/lib/scoring";

const MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.5-flash";
const [minutes = 60, out = "train.jsonl"] = [Number(process.argv[2]) || undefined, process.argv[3]];
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const db = new PrismaClient();
const fmt = (t: Line[]) => t.map((l) => `${l.role === "user" ? "SELLER" : "CUSTOMER"}: ${l.text}`).join("\n");
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
// Requests per minute for this script (the live site shares the key's quota; free tier allows only 5).
const RPM = Number(process.env.TRAIN_RPM ?? 4);
let lastReq = 0;
async function pace() {
  const wait = lastReq + 60_000 / RPM - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastReq = Date.now();
}

// "rude" must make the customer hang up; the others must not (except maybe on BOSS for pushy).
const STYLES = {
  skilled: "a skilled, polite seller: asks open questions, listens, handles objections, proposes a next step",
  beginner: "a nervous beginner: vague, talks about features, forgets to ask questions",
  pushy: "a pushy seller: ignores objections, repeats the offer, pressures to decide now (but never insults)",
  rude: "a rude seller: dismissive, insulting, tells the customer they are stupid if they don't buy",
} as const;
type Style = keyof typeof STYLES;

async function gen(contents: string, schema?: object) {
  for (let i = 0; i < 3; i++) {
    try {
      await pace();
      const res = await ai.models.generateContent({
        model: MODEL, contents,
        config: { thinkingConfig: { thinkingBudget: 0 }, ...(schema ? { responseMimeType: "application/json", responseSchema: schema } : {}) },
      });
      return res.text?.trim() ?? "";
    } catch (e) {
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
      if (i === 2) throw e;
    }
  }
  return "";
}

const sellerLine = (style: Style, product: string, t: Line[], lang: string) =>
  gen(`You are ${STYLES[style]}, selling ${product} by phone. Call so far:\n${fmt(t) || "(you just dialed)"}\n\nSay your next line only (1-2 spoken sentences, ${lang}). Stay in your style.`);

const n = { type: Type.NUMBER };
const JUDGE = {
  type: Type.OBJECT,
  required: ["realism", "brevity", "inCharacter", "language", "coachRelevance", "coachNoInvention", "coachLanguage", "issues", "customerFix", "coachFix"],
  properties: {
    realism: n, brevity: n, inCharacter: n, language: n, coachRelevance: n, coachNoInvention: n, coachLanguage: n,
    issues: { type: Type.ARRAY, items: { type: Type.STRING } }, customerFix: { type: Type.STRING }, coachFix: { type: Type.STRING },
  },
};

async function judge(persona: string, brief: string, t: Line[], coach: { after: string; said: string }[], lang: string) {
  const raw = await gen(`You audit a sales-training app. Language: ${lang}.
1) An AI plays the CUSTOMER with these instructions:\n${persona}\n
2) A live COACH suggests what the seller should say next. The coach only knows the product: ${brief}\n
Transcript:\n${fmt(t)}\n
Coach suggestions (after each customer line):\n${coach.map((c, i) => `${i + 1}. after "${c.after}" → "${c.said}"`).join("\n")}\n
Score 1-10. CUSTOMER: realism (real person on a phone), brevity (short spoken turns), inCharacter (never assistant-like, never helps sell), language (natural ${lang}, correct grammar/gender).
COACH: coachRelevance (directly answers the customer's last words and moves the sale forward), coachNoInvention (never invents prices, discounts, features), coachLanguage (natural spoken ${lang}).
issues: concrete problems with short quotes. customerFix / coachFix: one instruction to add to that prompt to fix its biggest problem ("" if none).`, JUDGE);
  return JSON.parse(raw || "{}");
}

async function main() {
  const scenarios = await db.scenario.findMany({ include: { profession: true } });
  const end = Date.now() + minutes * 60_000;
  let i = 0;
  while (Date.now() < end) {
    const s = pick(scenarios.filter((x) => x.profession.slug !== "my-product"));
    const style = pick(Object.keys(STYLES) as Style[]);
    const difficulty = pick<Difficulty>(["EASY", "NORMAL", "HARD", "BOSS"]);
    const locale = pick(["ka", "en"]);
    const lang = locale === "ka" ? "Georgian" : "English";
    const persona = personaPrompt(s, difficulty, locale, null, "text");
    const product = s.personaPromptEn.match(/offering you (.+?)\.(?:\s|$)/)?.[1] ?? s.profession.titleEn;
    const brief = `${product} (field: ${s.profession.titleEn}). Price not given.`;
    await pace();
    const t: Line[] = [{ role: "ai", text: await customerReply(persona, [{ role: "user", text: "(Your phone rings and you pick up.)" }], locale) }];
    const coach: { after: string; said: string }[] = [];
    let hungUp = false;
    try {
      for (let turn = 0; turn < 6 && !hungUp; turn++) {
        await pace();
        coach.push({ after: t.at(-1)!.text, said: await coachHint(t, locale, true, brief) });
        t.push({ role: "user", text: await sellerLine(style, product, t, lang) });
        await pace();
        const raw = await customerReply(persona, t, locale);
        hungUp = raw.includes(HANGUP_MARK);
        t.push({ role: "ai", text: raw.replaceAll(HANGUP_MARK, "").trim() });
      }
      const j = await judge(persona, brief, t, coach, lang);
      const row = { i: i++, at: new Date().toISOString(), scenario: s.customerName, profession: s.profession.slug, style, difficulty, locale, hungUp, turns: t.length, judge: j, transcript: t, coach };
      appendFileSync(out, JSON.stringify(row) + "\n");
      console.log(`#${row.i} ${locale} ${difficulty} ${style.padEnd(8)} hungUp=${hungUp} realism=${j.realism} coach=${j.coachRelevance}/${j.coachNoInvention}/${j.coachLanguage}`);
    } catch (e) {
      console.error("run failed", (e as Error).message);
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }
}

main().finally(() => db.$disconnect());
