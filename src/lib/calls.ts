import { cookies } from "next/headers";
import { db } from "./db";
import { getUser, isAdmin } from "./auth";
import { personaPrompt, type CustomProduct } from "./ai";
import { memoryForCustomer, sellerMemory } from "./memory";

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

// mode decides how the customer hangs up (voice: hang_up tool, text: marker); a voice call can fall back to text.
export const callPersona = (c: LoadedCall, mode: "voice" | "text" = "voice", history = "") =>
  personaPrompt(c.scenario, c.difficulty, c.locale, c.customProduct as CustomProduct | null, mode, history);

// The customer the seller talks to: remembers an earlier call with this seller, if any.
export const customerPersona = async (c: LoadedCall, mode: "voice" | "text") =>
  callPersona(c, mode, memoryForCustomer(await sellerMemory(c.userId, c.scenarioId, c.id)));

// What the seller is selling, for the coach. Only the product, never the customer's persona/hidden objections.
export function sellerBrief(c: LoadedCall) {
  const p = c.customProduct as CustomProduct | null;
  if (p?.name) return `${p.name}. ${p.description} Price: ${p.price || "not given"}. Typical customer: ${p.target || "not given"}.`;
  const offered = c.scenario.personaPromptEn.match(/offering you (.+?)\.(?:\s|$)/)?.[1];
  return `${offered ?? "their product"} (field: ${c.scenario.profession.titleEn}). Price not given.`;
}

export const elapsedSec = (c: { startedAt: Date }) => Math.round((Date.now() - c.startedAt.getTime()) / 1000);
