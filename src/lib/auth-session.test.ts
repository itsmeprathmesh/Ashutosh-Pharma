import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN_SESSION_SECONDS, adminCookieOptions, createAdminSession, verifyAdminSession } from "@/lib/auth-session";

describe("admin sessions", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("creates an eight-hour JWT only for allowlisted email accounts", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters-long");
    vi.stubEnv("ADMIN_EMAILS", "OWNER@example.com,second@example.com");
    const token = await createAdminSession("owner@example.com");
    expect(await verifyAdminSession(token)).toBe("owner@example.com");
    expect(await verifyAdminSession(`${token}x`)).toBeNull();
    expect(ADMIN_SESSION_SECONDS).toBe(8 * 60 * 60);
  });
  it("sets the required cookie security flags", () => {
    expect(adminCookieOptions).toMatchObject({ httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 28_800 });
  });
});
