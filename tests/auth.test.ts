import { afterEach, describe, expect, it, vi } from "vitest";

const verifySessionCookie = vi.fn();
vi.mock("@/lib/firebase-admin", () => ({ adminAuth: () => ({ verifySessionCookie }) }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const { uidFromSession } = await import("@/lib/auth");

describe("uidFromSession (auth guard)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    verifySessionCookie.mockReset();
  });

  it("rejects missing cookies", async () => {
    expect(await uidFromSession(undefined)).toBeNull();
  });

  it("accepts dev cookies only in development without Firebase", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT", "");
    expect(await uidFromSession("dev:student")).toBe("dev:student");
    vi.stubEnv("NODE_ENV", "production");
    expect(await uidFromSession("dev:admin")).toBeNull();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT", "{}");
    expect(await uidFromSession("dev:admin")).toBeNull();
  });

  it("verifies real session cookies with Firebase and rejects invalid ones", async () => {
    verifySessionCookie.mockResolvedValueOnce({ uid: "abc" });
    expect(await uidFromSession("real-cookie")).toBe("abc");
    verifySessionCookie.mockRejectedValueOnce(new Error("expired"));
    expect(await uidFromSession("bad-cookie")).toBeNull();
  });
});
