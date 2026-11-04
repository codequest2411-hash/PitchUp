import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { coachHint } from "@/lib/ai";
import { loadCall, sellerBrief } from "@/lib/calls";
import { memoryForCoach, sellerMemory } from "@/lib/memory";
import { HINT_COST, levelFromXp } from "@/lib/levels";
import type { Line } from "@/lib/scoring";

const Body = z.object({ live: z.boolean().optional(), transcript: z.array(z.object({ role: z.enum(["user", "ai"]), text: z.string().max(2000) })).max(200).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const call = await loadCall((await params).id);
  if (!call || call.endedAt) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = Body.safeParse(await req.json().catch(() => ({})));
  const transcript: Line[] = call.mode === "voice" && body.success && body.data.transcript ? body.data.transcript : (call.transcript as Line[]);

  const memory = memoryForCoach(await sellerMemory(call.userId, call.scenarioId, call.id));
  // Live coach: free, but only right after a customer line so it can't be spammed.
  if (body.success && body.data.live) {
    if (transcript.at(-1)?.role !== "ai") return NextResponse.json({ error: "not your turn" }, { status: 409 });
    return NextResponse.json({ hint: await coachHint(transcript, call.locale, true, sellerBrief(call), memory) });
  }

  const user = await getUser();
  if (user) {
    const xp = Math.max(0, user.xp - HINT_COST);
    await db.user.update({ where: { id: user.id }, data: { xp, level: levelFromXp(xp) } });
  }
  await db.call.update({ where: { id: call.id }, data: { hintsUsed: { increment: 1 } } });
  return NextResponse.json({ hint: await coachHint(transcript, call.locale, false, sellerBrief(call), memory) });
}
