import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { openPortal, paymentsConfigured } from "@/lib/payments";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!paymentsConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const { locale } = z.object({ locale: z.enum(["ka", "en"]) }).catch({ locale: "ka" }).parse(await req.json().catch(() => ({})));
  return NextResponse.json({ url: await openPortal(user, locale) });
}
