import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  purchase: { findUnique: vi.fn(), create: vi.fn((x) => x) },
  subscription: { findFirst: vi.fn(), create: vi.fn((x) => x) },
  $transaction: vi.fn(),
};
vi.mock("@/lib/db", () => ({ db }));

const { verifyDodoSignature, handleDodoEvent } = await import("@/lib/payments");
const secret = "whsec_" + Buffer.from("test-key").toString("base64");
const sign = (id: string, ts: string, body: string) =>
  "v1," + crypto.createHmac("sha256", Buffer.from("test-key")).update(`${id}.${ts}.${body}`).digest("base64");

const paid = (cents: number, meta: object, id = "pay_1") => ({
  type: "payment.succeeded",
  data: { payment_id: id, total_amount: cents, currency: "USD", metadata: { userId: "u1", expectedCents: "1200", ...meta } },
});

describe("dodo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts a valid Standard Webhooks signature and rejects tampering or old timestamps", () => {
    const now = 1_800_000_000_000, ts = String(now / 1000), body = '{"type":"payment.succeeded"}';
    const h = { id: "msg_1", timestamp: ts, signature: `v0,xxx ${sign("msg_1", ts, body)}` };
    expect(verifyDodoSignature(body, h, secret, now)).toBe(true);
    expect(verifyDodoSignature(body + " ", h, secret, now)).toBe(false);
    expect(verifyDodoSignature(body, h, secret, now + 10 * 60_000)).toBe(false);
    expect(verifyDodoSignature(body, h, "", now)).toBe(false);
  });

  it("grants a month of Pro once, stacked on time left", async () => {
    const left = new Date(Date.now() + 10 * 86400000);
    db.subscription.findFirst.mockResolvedValue({ currentPeriodEnd: left });
    await handleDodoEvent(paid(1200, { plan: "pro_monthly" }));
    const end = db.subscription.create.mock.calls[0][0].data.currentPeriodEnd as Date;
    expect(end.getTime() - left.getTime()).toBeGreaterThan(27 * 86400000);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    db.purchase.findUnique.mockResolvedValue({ id: "p" }); // webhook retry
    await handleDodoEvent(paid(1200, { plan: "pro_monthly" }));
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it("does not grant when the buyer lowered the price or it wasn't a success", async () => {
    await handleDodoEvent(paid(100, { plan: "pro_monthly" }));
    await handleDodoEvent({ ...paid(1200, { plan: "pro_monthly" }), type: "payment.failed" });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
