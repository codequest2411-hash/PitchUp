import { NextResponse } from "next/server";
import { handleDodoEvent, verifyDodoSignature } from "@/lib/payments";

export async function POST(req: Request) {
  const body = await req.text(); // raw body: the signature covers the exact bytes
  const h = req.headers;
  if (!verifyDodoSignature(body, { id: h.get("webhook-id"), timestamp: h.get("webhook-timestamp"), signature: h.get("webhook-signature") }))
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  await handleDodoEvent(JSON.parse(body));
  return NextResponse.json({ received: true });
}
