import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { customerReply } from "@/lib/ai";
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
  const reply = await customerReply(callPersona(call), transcript, call.locale);
  transcript.push({ role: "ai", text: reply });
  await db.call.update({ where: { id: call.id }, data: { transcript } });
  return NextResponse.json({ reply });
}
