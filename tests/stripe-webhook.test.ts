import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const db = {
  purchase: { upsert: vi.fn() },
  subscription: { upsert: vi.fn() },
  user: { findUnique: vi.fn() },
};
vi.mock("@/lib/db", () => ({ db }));

const { handleStripeEvent } = await import("@/lib/payments");
const ev = (type: string, object: object) => ({ type, data: { object } }) as unknown as Stripe.Event;

describe("handleStripeEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records a paid course purchase idempotently (upsert by session id)", async () => {
    const session = { id: "cs_1", mode: "payment", payment_status: "paid", amount_total: 4900, currency: "gel", metadata: { userId: "u1", courseId: "c1" } };
    await handleStripeEvent(ev("checkout.session.completed", session));
    await handleStripeEvent(ev("checkout.session.completed", session));
    expect(db.purchase.upsert).toHaveBeenCalledTimes(2);
    expect(db.purchase.upsert.mock.calls[0][0]).toMatchObject({
      where: { stripePaymentId: "cs_1" },
      create: { userId: "u1", courseId: "c1", amount: 4900, currency: "gel" },
      update: {},
    });
  });

  it("ignores unpaid checkout sessions", async () => {
    await handleStripeEvent(ev("checkout.session.completed", { id: "cs_2", mode: "payment", payment_status: "unpaid", metadata: { userId: "u1" } }));
    expect(db.purchase.upsert).not.toHaveBeenCalled();
  });

  it("upserts subscriptions with period end from subscription items", async () => {
    await handleStripeEvent(ev("customer.subscription.updated", {
      id: "sub_1", customer: "cus_1", status: "active", metadata: { userId: "u1", plan: "pro_yearly" },
      items: { data: [{ current_period_end: 1800000000 }] },
    }));
    expect(db.subscription.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { stripeSubId: "sub_1" },
      update: expect.objectContaining({ status: "active", plan: "pro_yearly", currentPeriodEnd: new Date(1800000000 * 1000) }),
    }));
  });

  it("skips subscriptions without our userId metadata", async () => {
    await handleStripeEvent(ev("customer.subscription.deleted", { id: "sub_x", metadata: {}, items: { data: [] } }));
    expect(db.subscription.upsert).not.toHaveBeenCalled();
  });
});
