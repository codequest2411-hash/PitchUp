import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { aiConfigured, liveAssist } from "@/lib/ai";
import { consumeCall, LIVE_ASSIST_PER_DAY, userContext } from "@/lib/access";

// ~25s of 16kHz mono WAV, base64. Keeps requests under Vercel's 4.5MB body limit.
const Body = z.object({
  speaker: z.enum(["user", "ai"]),
  audio: z.string().min(100).max(1_100_000),
  transcript: z.array(z.object({ role: z.enum(["user", "ai"]), text: z.string().max(2000) })).max(40),
  locale: z.enum(["en", "ka"]),
  brief: z.string().trim().max(600).optional(), // what the seller is selling, typed by them
});

// Used by the PitchUp Live desktop app (and /live-assist page). Audio is only passed to Gemini, never stored.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  if (!aiConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const { tier } = await userContext(user);
  if (tier !== "ultra" && !(await consumeCall(`assist:${user.id}`, LIVE_ASSIST_PER_DAY[tier]))) {
    return NextResponse.json({ error: "limit" }, { status: 429 });
  }
  const { speaker, audio, transcript, locale, brief } = body.data;
  try {
    return NextResponse.json(await liveAssist(audio, speaker, transcript, locale, brief));
  } catch (e) {
    console.error("liveAssist failed", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
