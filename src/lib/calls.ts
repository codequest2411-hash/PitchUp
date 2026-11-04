import { cookies } from "next/headers";
import { db } from "./db";
import { getUser, isAdmin } from "./auth";
import { personaPrompt, type CustomProduct } from "./ai";

export const GUEST_CALL_COOKIE = "guest_call";

// Returns the call only if the requester owns it (user) or holds the guest cookie for it. Admins see all.
export async function loadCall(id: string) {
  const call = await db.call.findUnique({ where: { id }, include: { scenario: { include: { profession: true } } } });
  if (!call) return null;
  const user = await getUser();
  if (isAdmin(user)) return call;
  if (call.userId) return call.userId === user?.id ? call : null;
  return (await cookies()).get(GUEST_CALL_COOKIE)?.value === id ? call : null;
}

export type LoadedCall = NonNullable<Awaited<ReturnType<typeof loadCall>>>;

export const callPersona = (c: LoadedCall) =>
  personaPrompt(c.scenario, c.difficulty, c.locale, c.customProduct as CustomProduct | null);

export const elapsedSec = (c: { startedAt: Date }) => Math.round((Date.now() - c.startedAt.getTime()) / 1000);
