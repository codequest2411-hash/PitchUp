import crypto from "node:crypto";
import type { User } from "@prisma/client";
import { db } from "./db";

// All payment-provider code lives here (Flitt hosted checkout, https://docs.flitt.com).
// Pro is prepaid: each approved payment extends access by one period; nothing auto-renews.
// shortcut: no Flitt recurring subscriptions (recurring_data signing is undocumented), add once Flitt confirms it.
// DB columns keep their stripe* names to avoid a migration; they hold Flitt order ids.

export const PLANS = {
  pro_monthly: { gel: 29, usd: 12, interval: "month" as const },
  pro_yearly: { gel: 249, usd: 99, interval: "year" as const },
};
export type PlanId = keyof typeof PLANS;
export type Currency = "gel" | "usd";

export const paymentsConfigured = () => Boolean(process.env.FLITT_MERCHANT_ID && process.env.FLITT_SECRET_KEY);
const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

// sha1("secret|v1|v2|...") over non-empty values sorted by key; signature fields excluded.
export function flittSignature(params: Record<string, unknown>, secret = process.env.FLITT_SECRET_KEY!) {
  const values = Object.keys(params)
    .filter((k) => k !== "signature" && k !== "response_signature_string")
    .sort()
    .map((k) => params[k])
    .filter((v) => v !== undefined && v !== null && v !== "")
    .map(String);
  return crypto.createHash("sha1").update([secret, ...values].join("|")).digest("hex");
}

type Meta = { userId: string; plan?: PlanId; courseId?: string };

export async function createCheckout(
  user: User,
  item: { kind: "plan"; plan: PlanId } | { kind: "course"; courseId: string },
  currency: Currency,
  locale: string,
) {
  let amount: number, desc: string, back: string;
  const meta: Meta = { userId: user.id };
  if (item.kind === "plan") {
    const p = PLANS[item.plan];
    amount = p[currency];
    desc = `PitchUp Pro (1 ${p.interval})`;
    back = `/${locale}/profile/billing?success=1`;
    meta.plan = item.plan;
  } else {
    const course = await db.course.findUniqueOrThrow({ where: { id: item.courseId } });
    amount = currency === "gel" ? course.priceGel : course.priceUsd;
    desc = course.titleEn;
    back = `/${locale}/courses/${course.slug}?success=1`;
    meta.courseId = course.id;
  }
  const request: Record<string, unknown> = {
    version: "1.0.1",
    merchant_id: Number(process.env.FLITT_MERCHANT_ID),
    order_id: `pitchup_${crypto.randomUUID()}`,
    order_desc: desc,
    amount: amount * 100,
    currency: currency.toUpperCase(),
    lang: locale === "ka" ? "ka" : "en",
    sender_email: user.email ?? undefined,
    merchant_data: JSON.stringify(meta),
    response_url: `${appUrl()}/api/flitt/return?to=${encodeURIComponent(back)}`,
    server_callback_url: `${appUrl()}/api/flitt/callback`,
  };
  request.signature = flittSignature(request);
  const res = await fetch("https://pay.flitt.com/api/checkout/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request }),
  });
  const { response } = await res.json();
  if (response?.response_status !== "success") throw new Error(`Flitt: ${response?.error_code} ${response?.error_message}`);
  return response.checkout_url as string;
}

const addPeriod = (from: Date, interval: "month" | "year") => {
  const d = new Date(from);
  if (interval === "month") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
};

// Idempotent: Flitt retries callbacks, the same order_id is only applied once.
export async function handleFlittCallback(body: Record<string, unknown>) {
  if (body.signature !== flittSignature(body)) return false;
  if (body.order_status !== "approved") return true;
  const orderId = String(body.order_id);
  if (await db.purchase.findUnique({ where: { stripePaymentId: orderId } })) return true;
  const meta = JSON.parse(String(body.merchant_data || "{}")) as Meta;
  if (!meta.userId) return true;
  let sub;

  if (meta.plan && PLANS[meta.plan]) {
    // Stack on top of any time still left on an earlier payment.
    const current = await db.subscription.findFirst({ where: { userId: meta.userId, status: "active" }, orderBy: { currentPeriodEnd: "desc" } });
    const start = current && current.currentPeriodEnd > new Date() ? current.currentPeriodEnd : new Date();
    sub = db.subscription.create({
      data: { userId: meta.userId, stripeCustomerId: "flitt", stripeSubId: orderId, plan: meta.plan, status: "active", currentPeriodEnd: addPeriod(start, PLANS[meta.plan].interval) },
    });
  }
  const purchase = db.purchase.create({
    data: { stripePaymentId: orderId, userId: meta.userId, courseId: meta.courseId ?? null, amount: Number(body.amount), currency: String(body.currency).toLowerCase() },
  });
  await (sub ? db.$transaction([sub, purchase]) : db.$transaction([purchase]));
  return true;
}
