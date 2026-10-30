import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { consumeCall, FREE_CALLS_PER_DAY, GUEST_CALLS_PER_DAY, ipKey, MAX_SEC, userContext } from "@/lib/access";
import { DIFFICULTY_MIN_LEVEL } from "@/lib/levels";
import { GUEST_CALL_COOKIE } from "@/lib/calls";

const s = (max: number) => z.string().trim().max(max);
const Body = z.object({
  scenarioId: z.string().min(1),
  difficulty: z.enum(["EASY", "NORMAL", "HARD", "BOSS"]),
  locale: z.enum(["ka", "en"]),
  mode: z.enum(["voice", "text"]),
  customProduct: z.object({ name: s(100).min(1), description: s(600), price: s(60), target: s(150) }).nullish(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const b = parsed.data;

  const user = await getUser();
  const { pro, level } = await userContext(user);
  const scenario = await db.scenario.findUnique({ where: { id: b.scenarioId } });
  if (!scenario) return NextResponse.json({ error: "not found" }, { status: 404 });

  const locked =
    scenario.requiredLevel > level ||
    DIFFICULTY_MIN_LEVEL[b.difficulty] > level ||
    ((scenario.isPro || b.difficulty === "BOSS") && !pro);
  if (locked) return NextResponse.json({ error: "locked" }, { status: 403 });

  if (!pro) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    const ok = user
      ? await consumeCall(`user:${user.id}`, FREE_CALLS_PER_DAY)
      : await consumeCall(ipKey(ip), GUEST_CALLS_PER_DAY);
    if (!ok) return NextResponse.json({ error: "limit" }, { status: 429 });
  }

  const call = await db.call.create({
    data: {
      userId: user?.id,
      scenarioId: scenario.id,
      difficulty: b.difficulty,
      locale: b.locale,
      mode: b.mode === "voice" && aiConfigured() ? "voice" : "text",
      customProduct: b.customProduct ?? undefined,
      maxSec: !user ? MAX_SEC.guest : pro ? MAX_SEC.pro : MAX_SEC.free,
    },
  });

  const res = NextResponse.json({ id: call.id });
  if (!user) res.cookies.set(GUEST_CALL_COOKIE, call.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 86400 });
  return res;
}
