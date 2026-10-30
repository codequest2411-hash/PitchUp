import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Difficulty, Scenario } from "@prisma/client";
import { heuristicScore, parseScore, type Line, type Score } from "./scoring";

// 3.5-flash: ~1.5s replies in good Georgian; 3.8-flash was overloaded (503) when tested 2026-10-30.
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.5-flash";
export const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL ?? "gemini-3.8-live";

export const aiConfigured = () => Boolean(process.env.GEMINI_API_KEY);
const client = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Phone-call replies must be fast; with thinking on, replies took ~45s and got cut off.
const NO_THINKING = { thinkingConfig: { thinkingBudget: 0 } };

export type CustomProduct = { name: string; description: string; price: string; target: string };

const DIFFICULTY_NOTE: Record<Difficulty, string> = {
  EASY: "Be friendly and fairly easy to convince.",
  NORMAL: "Be realistic: polite but not easily convinced.",
  HARD: "Be tough: interrupt sometimes, push back on price, demand proof.",
  BOSS: "Be extremely demanding: very little time, many objections, only buy after an excellent pitch and a clear close.",
};

export function personaPrompt(s: Scenario, difficulty: Difficulty, locale: string, product?: CustomProduct | null) {
  const lang = locale === "ka" ? "Georgian" : "English";
  return [
    "You are role-playing a CUSTOMER on a sales phone call. The user is the SELLER practicing their pitch.",
    locale === "ka" ? s.personaPromptKa : s.personaPromptEn,
    product &&
      `The product being sold: "${product.name}" — ${product.description}. Price: ${product.price}. You are a typical "${product.target}" customer.`,
    DIFFICULTY_NOTE[difficulty],
    "You have a name, a personality, a budget, real pain points, hidden objections and one buying trigger. Reveal the hidden objections only when the seller asks good questions.",
    "Stay in character the whole call. Never coach the seller, never mention you are an AI. Keep replies short (1-3 sentences) like a real phone call.",
    "Only agree to buy if the seller has earned it.",
    `Speak only ${lang}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

const MOCK_REPLIES = {
  ka: ["გისმენთ, რა გნებავთ?", "საინტერესოა, მაგრამ რატომ უნდა ავირჩიო თქვენ?", "ცოტა ძვირი მეჩვენება.", "კარგი, კიდევ რა უპირატესობა აქვს?", "ვიფიქრებ და დაგიკავშირდებით."],
  en: ["Hello, what is this about?", "Interesting, but why should I choose you?", "That seems a bit expensive.", "OK, what else makes it worth it?", "Let me think about it and get back to you."],
};

// shortcut: canned replies when Gemini is not configured or fails (e.g. 503 overload), so a call never breaks.
function mockReply(transcript: Line[], locale: string) {
  const list = MOCK_REPLIES[locale === "en" ? "en" : "ka"];
  return list[Math.min(transcript.filter((l) => l.role === "ai").length, list.length - 1)];
}

export async function customerReply(system: string, transcript: Line[], locale: string) {
  if (!aiConfigured()) return mockReply(transcript, locale);
  try {
    const res = await client().models.generateContent({
      model: TEXT_MODEL,
      contents: transcript.map((l) => ({ role: l.role === "user" ? "user" : "model", parts: [{ text: l.text }] })),
      config: { systemInstruction: system, maxOutputTokens: 300, ...NO_THINKING },
    });
    return res.text?.trim() || mockReply(transcript, locale);
  } catch (e) {
    console.error("customerReply failed", e);
    return mockReply(transcript, locale);
  }
}

const FALLBACK_HINT = {
  ka: "დასვი ღია კითხვა: „რა არის თქვენთვის ყველაზე მნიშვნელოვანი?“",
  en: "Ask an open question: \"What matters most to you here?\"",
};

export async function coachHint(transcript: Line[], locale: string) {
  const fallback = FALLBACK_HINT[locale === "en" ? "en" : "ka"];
  if (!aiConfigured()) return fallback;
  try {
    const res = await client().models.generateContent({
      model: TEXT_MODEL,
      contents: `You are a sales coach. Here is a sales call so far:\n${fmt(transcript)}\n\nGive the SELLER one short, concrete tip (max 25 words) for their next line. Answer in ${locale === "ka" ? "Georgian" : "English"}.`,
      config: NO_THINKING,
    });
    return res.text?.trim() || fallback;
  } catch (e) {
    console.error("coachHint failed", e);
    return fallback;
  }
}

const fmt = (t: Line[]) => t.map((l) => `${l.role === "user" ? "SELLER" : "CUSTOMER"}: ${l.text}`).join("\n");

const n = { type: Type.NUMBER };
const SCORE_SCHEMA = {
  type: Type.OBJECT,
  required: ["score", "outcome", "subScores", "wellDone", "improve", "rewrite"],
  properties: {
    score: n,
    outcome: { type: Type.STRING, enum: ["SOLD", "FOLLOW_UP", "LOST"] },
    subScores: {
      type: Type.OBJECT,
      required: ["opening", "discovery", "value", "objections", "closing", "tone"],
      properties: { opening: n, discovery: n, value: n, objections: n, closing: n, tone: n },
    },
    wellDone: { type: Type.ARRAY, items: { type: Type.STRING } },
    improve: { type: Type.ARRAY, items: { type: Type.STRING } },
    rewrite: { type: Type.STRING },
  },
};

export async function scoreCall(transcript: Line[], persona: string, locale: string): Promise<Score> {
  if (!aiConfigured() || !transcript.some((l) => l.role === "user")) return heuristicScore(transcript, locale);
  const prompt = `You are an expert sales coach. Evaluate the SELLER in this practice call.
Customer persona: ${persona}

Transcript:
${fmt(transcript)}

Score 0-100 overall and for: opening, discovery (questions), value (presentation), objections (handling), closing, tone (confidence).
outcome: SOLD if the customer agreed to buy, FOLLOW_UP if they agreed to a next step, LOST otherwise.
wellDone: exactly 3 things done well. improve: exactly 3 things to improve.
rewrite: rewrite the seller's weakest moment as a better line.
Write all text in ${locale === "ka" ? "Georgian" : "English"}.`;
  // Two tries (503 overloads are short-lived), then the heuristic so an ended call always gets a score.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await client().models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: SCORE_SCHEMA, ...NO_THINKING },
      });
      return parseScore(res.text ?? "");
    } catch (e) {
      console.error(`scoreCall attempt ${attempt} failed`, e);
    }
  }
  return heuristicScore(transcript, locale);
}

// One-use ephemeral token so the browser can open a Gemini Live session without seeing our API key.
// The persona is locked into the token, so the client can't change it.
export async function liveToken(system: string, maxSec: number, locale: string) {
  const token = await client().authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(Date.now() + (maxSec + 30) * 1000).toISOString(),
      newSessionExpireTime: new Date(Date.now() + 60_000).toISOString(),
      liveConnectConstraints: {
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: system,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { languageCode: locale === "ka" ? "ka-GE" : "en-US" },
        },
      },
      lockAdditionalFields: [],
      httpOptions: { apiVersion: "v1alpha" },
    },
  });
  return token.name!;
}
