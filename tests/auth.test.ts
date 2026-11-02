import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const { uidFromSession, createSessionCookie } = await import("@/lib/auth");

describe("uidFromSession (auth guard)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("rejects missing cookies", async () => {
    expect(await uidFromSession(undefined)).toBeNull();
  });

  it("accepts dev cookies only in development without Supabase", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SUPABASE_URL", "");
    expect(await uidFromSession("dev:student")).toBe("dev:student");
    vi.stubEnv("NODE_ENV", "production");
    expect(await uidFromSession("dev:admin")).toBeNull();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SUPABASE_URL", "https://x.supabase.co");
    expect(await uidFromSession("dev:admin")).toBeNull();
  });

  it("accepts our signed cookies and rejects forged or expired ones", async () => {
    vi.stubEnv("SESSION_SECRET", "s1");
    const c = createSessionCookie("abc-123");
    expect(await uidFromSession(c)).toBe("abc-123");
    const [, exp, sig] = c.split(".");
    expect(await uidFromSession(`other.${exp}.${sig}`)).toBeNull();
    expect(await uidFromSession(`abc-123.${Number(exp) + 1}.${sig}`)).toBeNull();
    vi.stubEnv("SESSION_SECRET", "s2");
    expect(await uidFromSession(c)).toBeNull();
    vi.useFakeTimers({ now: Date.now() + 31 * 86400000 });
    vi.stubEnv("SESSION_SECRET", "s1");
    expect(await uidFromSession(c)).toBeNull();
    vi.useRealTimers();
  });
});
