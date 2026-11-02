import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  purchase: { findUnique: vi.fn(), create: vi.fn((x) => x) },
  subscription: { findFirst: vi.fn(), create: vi.fn((x) => x) },
  $transaction: vi.fn(),
};
vi.mock("@/lib/db", () => ({ db }));
process.env.FLITT_SECRET_KEY = "test";

const { flittSignature, handleFlittCallback } = await import("@/lib/payments");
const signed = (b: Record<string, unknown>) => ({ ...b, signature: flittSignature(b) });

describe("flitt", () => {
  beforeEach(() => vi.clearAllMocks());

  // The docs' printed hash is wrong; this is sha1 of their documented string, which pay.flitt.com accepted.
  it("signs like the Flitt docs string", () => {
    expect(flittSignature({ amount: 1000, currency: "GEL", merchant_id: 1549901, order_desc: "Test payment", order_id: "TestOrder2", server_callback_url: "http://myshop/callback/", empty: "" }))
      .toBe("cd0edb710cbbdb6c2a4d965cdb91fdfabc343215");
  });

  it("rejects a tampered callback", async () => {
    const b = signed({ order_id: "o1", order_status: "approved", amount: "2900", currency: "GEL", merchant_data: '{"userId":"u1","plan":"pro_monthly"}' });
    expect(await handleFlittCallback({ ...b, amount: "1" })).toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("grants a month of Pro once, stacked on time left", async () => {
    const left = new Date(Date.now() + 10 * 86400000);
    db.subscription.findFirst.mockResolvedValue({ currentPeriodEnd: left });
    const b = signed({ order_id: "o2", order_status: "approved", amount: "2900", currency: "GEL", merchant_data: '{"userId":"u1","plan":"pro_monthly"}' });
    expect(await handleFlittCallback(b)).toBe(true);
    const end = db.subscription.create.mock.calls[0][0].data.currentPeriodEnd as Date;
    expect(end.getTime() - left.getTime()).toBeGreaterThan(27 * 86400000);
    expect(db.$transaction).toHaveBeenCalledTimes(1);

    db.purchase.findUnique.mockResolvedValue({ id: "p" }); // Flitt retry
    expect(await handleFlittCallback(b)).toBe(true);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it("ignores declined payments", async () => {
    await handleFlittCallback(signed({ order_id: "o3", order_status: "declined", merchant_data: '{"userId":"u1"}' }));
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
