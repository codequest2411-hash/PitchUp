import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { customerReply, HANGUP_MARK } from "@/lib/ai";
import { callPersona, elapsedSec, loadCall } from "@/lib/calls";
import type { Line } from "@/lib/scoring";

const Body = z.object({ text: z.string().trim().min(1).max(1000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const call = await loadCall((await params).id);
  if (!call) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (call.endedAt || elapsedSec(call) > call.maxSec + 15) return NextResponse.json({ error: "ended" }, { status: 409 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const transcript: Line[] = [...(call.transcript as Line[]), { role: "user", text: parsed.data.text }];
  const raw = await customerReply(callPersona(call, "text"), transcript, call.locale);
  const hungUp = raw.includes(HANGUP_MARK);
  const reply = raw.replaceAll(HANGUP_MARK, "").trim() || "...";
  transcript.push({ role: "ai", text: reply });
  await db.call.update({ where: { id: call.id }, data: { transcript } });
  return NextResponse.json({ reply, hungUp });
}
