import crypto from "node:crypto";
import type { User } from "@prisma/client";
import { db } from "./db";

// All payment-provider code lives here: Dodo Payments hosted checkout (https://docs.dodopayments.com).
// One "pay what you want" product (USD) in the Dodo dashboard; each checkout sets the exact amount and the
// webhook only grants access when at least that amount was paid (PWYW lets the buyer edit the price).
// Pro is prepaid: each payment extends access by one period; nothing auto-renews.
// Prices are set in USD (PWYW base currency must be USD/GBP/EUR); with Adaptive Currency on, the check uses the USD settlement amount.
// DB columns keep their stripe* names to avoid a migration; they hold Dodo payment ids.

export const PLANS = {
  pro_monthly: { gel: 29, usd: 12, interval: "month" as const },
  pro_yearly: { gel: 249, usd: 99, interval: "year" as const },
  ultra_monthly: { gel: 69, usd: 29, interval: "month" as const },
  ultra_yearly: { gel: 599, usd: 249, interval: "year" as const },
};
export type PlanId = keyof typeof PLANS;
export type Currency = "gel" | "usd";

export const paymentsConfigured = () => Boolean(process.env.DODO_PAYMENTS_API_KEY && process.env.DODO_PRODUCT_ID);
const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";
const dodoBase = () => (process.env.DODO_PAYMENTS_API_KEY?.startsWith("dodo_live_") ? "https://live.dodopayments.com" : "https://test.dodopayments.com");

type Meta = { userId: string; plan?: PlanId; courseId?: string; expectedCents: string };

export async function createCheckout(
  user: User,
  item: { kind: "plan"; plan: PlanId } | { kind: "course"; courseId: string },
  _currency: Currency,
  locale: string,
) {
  let usd: number, back: string;
  const meta: Meta = { userId: user.id, expectedCents: "" };
  if (item.kind === "plan") {
    usd = PLANS[item.plan].usd;
    back = `/${locale}/profile/billing?success=1`;
    meta.plan = item.plan;
  } else {
    const course = await db.course.findUniqueOrThrow({ where: { id: item.courseId } });
    usd = course.priceUsd;
    back = `/${locale}/courses/${course.slug}?success=1`;
    meta.courseId = course.id;
  }
  meta.expectedCents = String(usd * 100);
  const res = await fetch(`${dodoBase()}/checkouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_cart: [{ product_id: process.env.DODO_PRODUCT_ID, quantity: 1, amount: usd * 100 }],
      customer: { email: user.email ?? undefined, name: user.name ?? undefined },
      return_url: `${appUrl()}${back}`,
      metadata: meta,
    }),
  });
  const out = await res.json().catch(() => null);
  if (!res.ok || !out?.checkout_url) throw new Error(`Dodo checkout ${res.status}: ${JSON.stringify(out).slice(0, 300)}`);
  return out.checkout_url as string;
}

// Standard Webhooks: base64 HMAC-SHA256 of "id.timestamp.body" with the base64 key after "whsec_".
export function verifyDodoSignature(body: string, h: { id: string | null; timestamp: string | null; signature: string | null }, secret = process.env.DODO_WEBHOOK_KEY ?? "", now = Date.now()) {
  if (!secret || !h.id || !h.timestamp || !h.signature) return false;
  if (Math.abs(now / 1000 - Number(h.timestamp)) > 300) return false; // replay window
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = Buffer.from(crypto.createHmac("sha256", key).update(`${h.id}.${h.timestamp}.${body}`).digest("base64"));
  return h.signature.split(" ").some((s) => {
    const sig = Buffer.from(s.split(",")[1] ?? "");
    return sig.length === expected.length && crypto.timingSafeEqual(sig, expected);
  });
}

const addPeriod = (from: Date, interval: "month" | "year") => {
  const d = new Date(from);
  if (interval === "month") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
};

type DodoEvent = {
  type?: string;
  data?: { payment_id?: string; total_amount?: number; currency?: string; settlement_amount?: number; settlement_currency?: string; metadata?: Partial<Meta> };
};

// With Adaptive Currency the buyer pays in local money (e.g. GEL); settlement_* is what we receive in USD.
const paidUsdCents = (d: NonNullable<DodoEvent["data"]>) =>
  d.settlement_currency?.toUpperCase() === "USD" ? Number(d.settlement_amount)
  : d.currency?.toUpperCase() === "USD" ? Number(d.total_amount)
  : NaN;

// Idempotent: Dodo retries webhooks, the same payment_id is only applied once.
export async function handleDodoEvent(event: DodoEvent) {
  const d = event.data;
  if (event.type !== "payment.succeeded" || !d?.payment_id) return;
  const meta = d.metadata ?? {};
  if (!meta.userId) return;
  const paid = paidUsdCents(d);
  if (!(paid >= Number(meta.expectedCents))) {
    console.error("dodo payment below expected amount, not granting", d.payment_id, d.total_amount, d.currency, d.settlement_amount, d.settlement_currency, meta.expectedCents);
    return;
  }
  if (await db.purchase.findUnique({ where: { stripePaymentId: d.payment_id } })) return;
  let sub;
  if (meta.plan && PLANS[meta.plan]) {
    // Stack on top of time still left on an earlier payment of the same tier (Pro and Ultra run side by side).
    const tier = meta.plan.split("_")[0];
    const current = await db.subscription.findFirst({ where: { userId: meta.userId, status: "active", plan: { startsWith: tier } }, orderBy: { currentPeriodEnd: "desc" } });
    const start = current && current.currentPeriodEnd > new Date() ? current.currentPeriodEnd : new Date();
    sub = db.subscription.create({
      data: { userId: meta.userId, stripeCustomerId: "dodo", stripeSubId: d.payment_id, plan: meta.plan, status: "active", currentPeriodEnd: addPeriod(start, PLANS[meta.plan].interval) },
    });
  }
  const purchase = db.purchase.create({
    data: { stripePaymentId: d.payment_id, userId: meta.userId, courseId: meta.courseId ?? null, amount: paid, currency: "usd" },
  });
  await (sub ? db.$transaction([sub, purchase]) : db.$transaction([purchase]));
}
