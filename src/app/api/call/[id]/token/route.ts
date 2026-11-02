import { NextResponse } from "next/server";
import { aiConfigured, LIVE_MODEL, liveToken, voiceFor } from "@/lib/ai";
import { callPersona, elapsedSec, loadCall } from "@/lib/calls";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!aiConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const call = await loadCall((await params).id);
  if (!call) return NextResponse.json({ error: "not found" }, { status: 404 });
  const left = call.maxSec - elapsedSec(call);
  if (call.endedAt || left <= 0) return NextResponse.json({ error: "ended" }, { status: 409 });
  try {
    // Token expiry = remaining call time, so the max call length is enforced by Google, not the browser.
    return NextResponse.json({ token: await liveToken(callPersona(call), left, call.locale, voiceFor(call.scenario.customerName)), model: LIVE_MODEL });
  } catch (e) {
    console.error("live token failed", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
