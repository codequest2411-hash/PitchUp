import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { createCheckout, paymentsConfigured } from "@/lib/payments";

const Body = z.intersection(
  z.object({ currency: z.enum(["gel", "usd"]), locale: z.enum(["ka", "en"]) }),
  z.union([
    z.object({ kind: z.literal("plan"), plan: z.enum(["pro_monthly", "pro_yearly", "ultra_monthly", "ultra_yearly"]) }),
    z.object({ kind: z.literal("course"), courseId: z.string().min(1) }),
  ]),
);

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!paymentsConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { currency, locale, ...item } = parsed.data;
  try {
    return NextResponse.json({ url: await createCheckout(user, item, currency, locale) });
  } catch (e) {
    console.error("checkout failed", e);
    return NextResponse.json({ error: "checkout failed" }, { status: 500 });
  }
}
