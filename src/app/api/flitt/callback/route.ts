import { NextResponse } from "next/server";
import { handleFlittCallback, paymentsConfigured } from "@/lib/payments";

export async function POST(req: Request) {
  if (!paymentsConfigured()) return NextResponse.json({ error: "not configured" }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "bad request" }, { status: 400 });
  if (!(await handleFlittCallback(body))) return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  return NextResponse.json({ received: true });
}
