import Stripe from "stripe";
import type { User } from "@prisma/client";
import { db } from "./db";

// All payment-provider code lives here. To add BOG / TBC Pay, implement the same
// createCheckout / openPortal functions and a webhook route for that provider.

export const PLANS = {
  pro_monthly: { gel: 29, usd: 12, interval: "month" as const },
  pro_yearly: { gel: 249, usd: 99, interval: "year" as const },
};
export type PlanId = keyof typeof PLANS;
export type Currency = "gel" | "usd";

export const paymentsConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
export const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!);
const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

async function customerId(user: User) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const c = await stripe().customers.create({ email: user.email ?? undefined, name: user.name ?? undefined, metadata: { userId: user.id } });
  await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: c.id } });
  return c.id;
}

export async function createCheckout(
  user: User,
  item: { kind: "plan"; plan: PlanId } | { kind: "course"; courseId: string },
  currency: Currency,
  locale: string,
) {
  const base = { customer: await customerId(user), client_reference_id: user.id, locale: (locale === "ka" ? "auto" : "en") as "auto" | "en" };
  if (item.kind === "plan") {
    const p = PLANS[item.plan];
    const session = await stripe().checkout.sessions.create({
      ...base,
      mode: "subscription",
      line_items: [{ quantity: 1, price_data: { currency, unit_amount: p[currency] * 100, recurring: { interval: p.interval }, product_data: { name: `PitchUp Pro (${p.interval})` } } }],
      metadata: { userId: user.id, plan: item.plan },
      subscription_data: { metadata: { userId: user.id, plan: item.plan } },
      success_url: `${appUrl()}/${locale}/profile/billing?success=1`,
      cancel_url: `${appUrl()}/${locale}/pricing?canceled=1`,
    });
    return session.url!;
  }
  const course = await db.course.findUniqueOrThrow({ where: { id: item.courseId } });
  const session = await stripe().checkout.sessions.create({
    ...base,
    mode: "payment",
    line_items: [{ quantity: 1, price_data: { currency, unit_amount: (currency === "gel" ? course.priceGel : course.priceUsd) * 100, product_data: { name: course.titleEn } } }],
    metadata: { userId: user.id, courseId: course.id },
    success_url: `${appUrl()}/${locale}/courses/${course.slug}?success=1`,
    cancel_url: `${appUrl()}/${locale}/courses/${course.slug}`,
  });
  return session.url!;
}

export async function openPortal(user: User, locale: string) {
  const s = await stripe().billingPortal.sessions.create({ customer: await customerId(user), return_url: `${appUrl()}/${locale}/profile/billing` });
  return s.url;
}

async function saveSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId;
  if (!userId) return;
  // Newer Stripe API versions moved current_period_end onto subscription items.
  const end = sub.items.data[0]?.current_period_end ?? (sub as unknown as { current_period_end: number }).current_period_end;
  const data = {
    userId,
    stripeCustomerId: String(sub.customer),
    plan: sub.metadata.plan ?? "pro_monthly",
    status: sub.status,
    currentPeriodEnd: new Date(end * 1000),
  };
  await db.subscription.upsert({ where: { stripeSubId: sub.id }, create: { ...data, stripeSubId: sub.id }, update: data });
}

// Idempotent: replaying the same event leaves the DB unchanged.
export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.mode === "payment" && s.payment_status === "paid" && s.metadata?.userId) {
        await db.purchase.upsert({
          where: { stripePaymentId: s.id },
          create: { stripePaymentId: s.id, userId: s.metadata.userId, courseId: s.metadata.courseId ?? null, amount: s.amount_total ?? 0, currency: s.currency ?? "usd" },
          update: {},
        });
      }
      if (s.mode === "subscription" && s.subscription) {
        await saveSubscription(await stripe().subscriptions.retrieve(String(s.subscription)));
      }
      break;
    }
    case "invoice.paid": {
      // Record subscription payments so admin revenue includes them.
      const inv = event.data.object as Stripe.Invoice;
      const user = await db.user.findUnique({ where: { stripeCustomerId: String(inv.customer) } });
      if (user && inv.id) {
        await db.purchase.upsert({
          where: { stripePaymentId: inv.id },
          create: { stripePaymentId: inv.id, userId: user.id, amount: inv.amount_paid, currency: inv.currency },
          update: {},
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await saveSubscription(event.data.object as Stripe.Subscription);
      break;
  }
}
