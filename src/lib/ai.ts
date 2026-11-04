import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Difficulty, Scenario } from "@prisma/client";
import { heuristicScore, parseScore, type Line, type Score } from "./scoring";

// 3.5-flash: ~1.5s replies in good Georgian; 3.8-flash was overloaded (503) when tested 2026-10-30.
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.5-flash";
export const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL ?? "gemini-3.8-live";
// Scoring isn't latency-critical: try the newest flash first, fall back when it's overloaded (503s seen 2026-11-02).
const SMART_MODELS = [process.env.GEMINI_SMART_MODEL ?? "gemini-3.8-flash", TEXT_MODEL];

export const aiConfigured = () => Boolean(process.env.GEMINI_API_KEY);
const client = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Phone-call replies must be fast; with thinking on, replies took ~45s and got cut off.
const NO_THINKING = { thinkingConfig: { thinkingBudget: 0 } };

export type CustomProduct = { name: string; description: string; price: string; target: string };

// Seeded customer names (Georgian + Latin spellings). Anything not listed is treated as female.
// shortcut: name list instead of a gender column on Scenario; add the column if admins create many new names.
const MALE_NAMES = new Set([
  "გიორგი", "ლევანი", "დავითი", "დავით", "ზურაბი", "ირაკლი", "ნიკა", "ლუკა", "ბექა", "გოგა", "საბა", "რატი", "ალექსი", "გურამი", "ბაჩო",
  "ნიკოლოზი", "ლაშა", "გიგა", "დათო", "ვახო", "სანდრო", "თორნიკე", "ოთარი", "ლადო", "მიშა", "ბესო", "ზაზა", "კოტე", "ტატო", "გია",
  "giorgi", "levani", "levan", "davit", "david", "zurab", "irakli", "nika", "luka", "beka", "goga", "saba", "rati", "aleksi", "alex",
  "guram", "bacho", "lasha", "giga", "dato", "sandro", "tornike", "otar", "lado", "misha", "zaza", "gia", "john", "michael", "mark", "tom",
]);
export const isMaleName = (name: string) => MALE_NAMES.has(name.trim().split(/\s+/)[0].toLowerCase());
// Gemini Live prebuilt voices: Charon/Puck are male, Kore/Aoede female.
export const voiceFor = (name: string) => (isMaleName(name) ? "Charon" : "Kore");

const DIFFICULTY_NOTE: Record<Difficulty, string> = {
  EASY: "Be friendly and fairly easy to convince.",
  NORMAL: "Be realistic: polite but not easily convinced.",
  HARD: "Be tough: interrupt sometimes, push back on price, demand proof.",
  BOSS: "Be extremely demanding: very little time, many objections, only buy after an excellent pitch and a clear close.",
};

// Text replies end with this marker when the customer hangs up; the server strips it.
export const HANGUP_MARK = "[HANGUP]";
const HANGUP_NOTE: Record<Difficulty, string> = {
  EASY: "You are patient: hang up only if the seller is insulting or ignores you completely.",
  NORMAL: "Hang up if the seller is rude, or keeps pushing after you clearly said no twice.",
  HARD: "You have little patience: hang up if the seller is rude, pushy, wastes your time or keeps ignoring your objections.",
  BOSS: "You have almost no patience: hang up quickly if the seller is rude, pushy, vague or keeps wasting your time.",
};

export function personaPrompt(s: Scenario, difficulty: Difficulty, locale: string, product?: CustomProduct | null, mode: "voice" | "text" = "voice") {
  const lang = locale === "ka" ? "Georgian" : "English";
  const male = isMaleName(s.customerName);
  return [
    `You are ${s.customerName}, a real ${male ? "man" : "woman"} who just picked up a sales phone call. The user is the SELLER calling you. You are NOT an assistant.`,
    locale === "ka" ? s.personaPromptKa : s.personaPromptEn,
    product &&
      `The product being sold: "${product.name}" — ${product.description}. Price: ${product.price}. You are a typical "${product.target}" customer.`,
    DIFFICULTY_NOTE[difficulty],
    "Before the call, silently decide: your job and daily situation, your budget, 2 real pain points, 2 hidden objections, and 1 thing that would make you buy. Keep them consistent for the whole call.",
    "Talk like a real person on the phone: short spoken sentences (usually 1-2, never more than 3), casual words, small reactions like \"mhm\", \"wait\", \"hmm\", \"honestly…\". No lists, no formal or written style, no long explanations.",
    "React to exactly what the seller just said. If they are vague, ask what they mean. If they talk too long, cut in. If they ask a good question, answer honestly and reveal a pain point. Reveal hidden objections only when the seller digs for them.",
    "You are busy and a little skeptical at first. Never help the seller sell, never summarize, never give advice, never say you are an AI or a role-play, never offer to help.",
    "Do not buy because of one nice sentence. Agree to buy (or to a clear next step) only after the seller understood your needs, showed value for YOUR situation and handled your objections. If they handled you badly, end politely: you're not interested.",
    `You can get annoyed like a real person. ${HANGUP_NOTE[difficulty]} Never hang up over a single weak line.`,
    mode === "voice"
      ? "To hang up: say one short, natural goodbye line that shows how you feel, then call the hang_up tool. Never say the word \"tool\"."
      : `To hang up: write one short, natural goodbye line that shows how you feel, then end your message with ${HANGUP_MARK}.`,
    `Speak only ${lang}${locale === "ka" ? ", natural spoken Georgian as people in Tbilisi talk, with correct grammar for your gender" : ""}.`,
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

// How a top seller picks the next line; shared by the in-call coach and PitchUp Live.
const SELLER_PLAYBOOK = `How to choose the line:
- First react to the customer's LAST words specifically (acknowledge, or answer their question). Never ignore what they said or change the subject.
- Early in the call or when you know little: ask ONE open question about their situation or problem.
- Objection (price, trust, "I'll think about it", competitor): acknowledge it briefly, then ask what's behind it or connect to the value for THEIR situation.
- Customer is interested or asks about details: summarise the value in their words and propose a concrete next step.
- Customer is annoyed or busy: be brief and respectful, offer a short way forward or a better time.
- Use only facts given about the product. Never invent prices, discounts, features or guarantees; if a fact is unknown, ask instead.`;

// live: the exact next sentence for the seller (shown automatically during the call); otherwise a short tip.
// brief: what the seller is selling (never the customer's hidden persona, so the coach can't cheat).
export async function coachHint(transcript: Line[], locale: string, live = false, brief = "") {
  const fallback = FALLBACK_HINT[locale === "en" ? "en" : "ka"];
  if (!aiConfigured()) return fallback;
  const lang = locale === "ka" ? "natural spoken Georgian (as people talk in Tbilisi, correct grammar)" : "English";
  const ctx = `${brief ? `What the seller is selling: ${brief}\n` : ""}The call so far (SELLER = the user, CUSTOMER = the person they called):\n${fmt(transcript)}`;
  try {
    const res = await client().models.generateContent({
      model: TEXT_MODEL,
      contents: live
        ? `You are an expert sales coach whispering to a seller during a live call.\n${ctx}\n\n${SELLER_PLAYBOOK}\n\nWrite ONLY the exact words the SELLER should say next: one or two short spoken sentences (max 25 words) in ${lang}. Not advice, not "you should…", no quotes, no labels.`
        : `You are an expert sales coach.\n${ctx}\n\n${SELLER_PLAYBOOK}\n\nGive the SELLER one short, concrete tip for their next line (max 30 words), including an example phrase. Answer in ${lang}.`,
      config: NO_THINKING,
    });
    return res.text?.trim() || fallback;
  } catch (e) {
    console.error("coachHint failed", e);
    return fallback;
  }
}

const ASSIST_SCHEMA = {
  type: Type.OBJECT,
  required: ["heard", "reply"],
  properties: { heard: { type: Type.STRING }, reply: { type: Type.STRING } },
};

// Desktop "PitchUp Live": one call transcribes the last spoken turn of a REAL call and, after a customer
// turn, writes the seller's next sentence (one call instead of transcribe + coachHint keeps it ~2s).
export async function liveAssist(wavBase64: string, speaker: "user" | "ai", transcript: Line[], locale: string, brief = "") {
  const lang = locale === "ka" ? "Georgian" : "English";
  const prompt = speaker === "ai"
    ? `You help a SELLER during a live sales call.\n${brief ? `What the seller is selling: ${brief}\n` : ""}The call so far:\n${fmt(transcript) || "(just started)"}\n\nThe audio is what the CUSTOMER just said. heard: transcribe it word for word in its original language. reply: the exact next words the SELLER should say (max 30 words), in the seller's own voice, in the language the customer speaks (if unclear, ${lang}). No quotes, no preamble. If the audio has no clear speech, return empty strings; never guess words.\n\n${SELLER_PLAYBOOK}`
    : `The audio is what the SELLER just said on a sales call. heard: transcribe it word for word in its original language (empty if no speech). reply: empty string.`;
  const res = await client().models.generateContent({
    model: TEXT_MODEL,
    contents: [{ role: "user", parts: [{ inlineData: { mimeType: "audio/wav", data: wavBase64 } }, { text: prompt }] }],
    config: { responseMimeType: "application/json", responseSchema: ASSIST_SCHEMA, ...NO_THINKING },
  });
  const out = JSON.parse(res.text ?? "{}");
  return { heard: String(out.heard ?? "").trim(), reply: speaker === "ai" ? String(out.reply ?? "").trim() : "" };
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
  for (const model of SMART_MODELS) {
    try {
      const res = await client().models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: SCORE_SCHEMA, ...NO_THINKING },
      });
      return parseScore(res.text ?? "");
    } catch (e) {
      console.error(`scoreCall with ${model} failed`, e);
    }
  }
  return heuristicScore(transcript, locale);
}

// One-use ephemeral token so the browser can open a Gemini Live session without seeing our API key.
// The persona is locked into the token, so the client can't change it.
export async function liveToken(system: string, maxSec: number, locale: string, voiceName: string) {
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
          speechConfig: { languageCode: locale === "ka" ? "ka-GE" : "en-US", voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      },
      lockAdditionalFields: [],
      httpOptions: { apiVersion: "v1alpha" },
    },
  });
  return token.name!;
}
