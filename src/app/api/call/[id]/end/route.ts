import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { scoreCall } from "@/lib/ai";
import { callPersona, elapsedSec, loadCall } from "@/lib/calls";
import { callXp } from "@/lib/levels";
import { memoryForScorer, sellerMemory } from "@/lib/memory";
import { addXp, awardBadge } from "@/lib/rewards";
import type { Line } from "@/lib/scoring";

const Body = z.object({
  transcript: z.array(z.object({ role: z.enum(["user", "ai"]), text: z.string().max(2000) })).max(200).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const call = await loadCall((await params).id);
  if (!call) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Claim the call atomically so a double "end" can't award XP twice.
  const claimed = await db.call.updateMany({ where: { id: call.id, endedAt: null }, data: { endedAt: new Date() } });
  if (!claimed.count) return NextResponse.json({ id: call.id });

  const body = Body.safeParse(await req.json().catch(() => ({})));
  // shortcut: voice transcripts come from the browser (Gemini Live talks to it directly), so a user could fake one; move Live behind a server relay if leaderboard cheating matters.
  const transcript: Line[] =
    call.mode === "voice" && body.success && body.data.transcript?.length ? body.data.transcript : (call.transcript as Line[]);

  const score = await scoreCall(transcript, callPersona(call), call.locale, memoryForScorer(await sellerMemory(call.userId, undefined, call.id)));
  let xpEarned = 0;
  if (call.userId) {
    const user = await db.user.findUniqueOrThrow({ where: { id: call.userId } });
    xpEarned = await addXp(user, callXp(score.score, call.difficulty, score.outcome === "SOLD"));
    await awardBadge(user.id, "FIRST_CALL");
    if (score.outcome === "SOLD") await awardBadge(user.id, "FIRST_SALE");
    if (score.outcome === "SOLD" && call.difficulty === "BOSS") await awardBadge(user.id, "BOSS_CLOSER");
  }

  await db.call.update({
    where: { id: call.id },
    data: {
      durationSec: Math.min(elapsedSec(call), call.maxSec),
      transcript: transcript as Prisma.InputJsonValue,
      outcome: score.outcome,
      score: score.score,
      subScores: score.subScores,
      feedback: { wellDone: score.wellDone, improve: score.improve, rewrite: score.rewrite },
      xpEarned,
    },
  });
  return NextResponse.json({ id: call.id });
}
