// What the AI remembers about a seller, built from their scored calls (no extra storage).
// Used by the live coach (practise weak skills), the scorer (compare with past calls) and the customer
// (remembers an earlier call with the same seller).
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { SKILLS, type Skill } from "./scoring";

export type SellerMemory = {
  calls: number;
  avgScore: number;
  skills: Record<Skill, number>;
  weak: Skill[];
  strong: Skill | null;
  recentTips: string[];
  lastWithCustomer: { outcome: string | null; daysAgo: number; score: number | null } | null;
};

type CallRow = { scenarioId: string; startedAt: Date; score: number | null; outcome: string | null; subScores: Prisma.JsonValue; feedback: Prisma.JsonValue };

// Pure part, unit-tested: rows are newest first.
export function buildMemory(rows: CallRow[], scenarioId?: string, now = Date.now()): SellerMemory | null {
  const scored = rows.filter((r) => r.score !== null);
  if (!scored.length) return null;
  const skills = Object.fromEntries(
    SKILLS.map((k) => {
      const v = scored.map((r) => Number((r.subScores as Record<string, unknown> | null)?.[k])).filter((x) => Number.isFinite(x));
      return [k, v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0];
    }),
  ) as Record<Skill, number>;
  const ranked = [...SKILLS].sort((a, b) => skills[a] - skills[b]);
  const recentTips = scored
    .slice(0, 2)
    .flatMap((r) => ((r.feedback as { improve?: unknown } | null)?.improve as string[] | undefined) ?? [])
    .filter((x) => typeof x === "string")
    .slice(0, 3);
  const last = scenarioId ? rows.find((r) => r.scenarioId === scenarioId) : undefined;
  return {
    calls: scored.length,
    avgScore: Math.round(scored.reduce((a, r) => a + (r.score ?? 0), 0) / scored.length),
    skills,
    weak: ranked.slice(0, 2),
    strong: scored.length >= 2 ? ranked[ranked.length - 1] : null,
    recentTips,
    lastWithCustomer: last ? { outcome: last.outcome, score: last.score, daysAgo: Math.floor((now - last.startedAt.getTime()) / 86_400_000) } : null,
  };
}

// excludeCallId: the call in progress, so it never "remembers" itself.
export async function sellerMemory(userId: string | null | undefined, scenarioId?: string, excludeCallId?: string) {
  if (!userId) return null;
  const rows = await db.call.findMany({
    where: { userId, endedAt: { not: null }, score: { not: null }, ...(excludeCallId ? { id: { not: excludeCallId } } : {}) },
    orderBy: { startedAt: "desc" },
    take: 10,
    select: { scenarioId: true, startedAt: true, score: true, outcome: true, subScores: true, feedback: true },
  });
  return buildMemory(rows, scenarioId);
}

// Prompt snippets. Written in English; the models answer in the call's language.
export const memoryForCoach = (m: SellerMemory | null) =>
  m ? `This seller's weakest skills so far: ${m.weak.join(", ")}. When it fits the moment, prefer a line that practises them.` : "";

export const memoryForScorer = (m: SellerMemory | null) =>
  m
    ? `The seller's history (${m.calls} earlier scored calls): average score ${m.avgScore}; skill averages ${SKILLS.map((k) => `${k} ${m.skills[k]}`).join(", ")}.${m.recentTips.length ? ` Advice they got last time: ${m.recentTips.join(" | ")}.` : ""} In wellDone/improve, say when they improved on or repeated an earlier weakness.`
    : "";

export const memoryForCustomer = (m: SellerMemory | null) => {
  const l = m?.lastWithCustomer;
  if (!l || l.daysAgo > 60) return "";
  const when = l.daysAgo === 0 ? "earlier today" : l.daysAgo === 1 ? "yesterday" : `${l.daysAgo} days ago`;
  const how = l.outcome === "SOLD" ? "you agreed to buy" : l.outcome === "FOLLOW_UP" ? "you agreed to talk again" : "you said no";
  return `You already spoke with this same seller ${when}; ${how}. You remember them: react naturally if they mention it, and you may bring it up yourself.`;
};
