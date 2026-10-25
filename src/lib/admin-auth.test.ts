import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_SESSION_COOKIE, createAdminSession, cookieValue, isAdminAuthorized, verifyAdminSession } from "@/lib/admin-auth";

describe("admin sessions", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_USER", "pharma-admin");
    vi.stubEnv("ADMIN_PASS", "a-long-example-password");
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-long-example-session-secret-32chars");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("creates a signed session for the configured admin", async () => {
    const token = await createAdminSession("pharma-admin");
    expect(await verifyAdminSession(token)).toBe(true);
  });

  it("rejects modified tokens and sessions for a different configured user", async () => {
    const token = await createAdminSession("pharma-admin");
    const [payload, signature] = token.split(".");
    const modifiedPayload = `${payload[0] === "A" ? "B" : "A"}${payload.slice(1)}`;
    expect(await verifyAdminSession(`${modifiedPayload}.${signature}`)).toBe(false);
    vi.stubEnv("ADMIN_USER", "another-admin");
    expect(await verifyAdminSession(token)).toBe(false);
  });

  it("reads the session cookie without confusing similarly named cookies", async () => {
    const token = await createAdminSession("pharma-admin");
    expect(cookieValue(`other=${token}; ${ADMIN_SESSION_COOKIE}=${token}`)).toBe(token);
    expect(await isAdminAuthorized(`${ADMIN_SESSION_COOKIE}=${token}`)).toBe(true);
  });

  it("rejects missing or malformed cookies", async () => {
    expect(await isAdminAuthorized(null)).toBe(false);
    expect(await isAdminAuthorized(`${ADMIN_SESSION_COOKIE}=not-a-token`)).toBe(false);
  });
});
