import { afterEach, describe, expect, it, vi } from "vitest";
import { openGoogleSessionHandoff, sealGoogleSessionHandoff } from "@/lib/google-admin-auth";

describe("Google admin session handoff", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts a short-lived handoff only for an allowlisted admin", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters-long");
    vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
    const token = await sealGoogleSessionHandoff("OWNER@example.com", "/admin/products");
    await expect(openGoogleSessionHandoff(token)).resolves.toEqual({
      email: "owner@example.com",
      next: "/admin/products",
    });
    await expect(openGoogleSessionHandoff(`${token}x`)).rejects.toThrow();
  });

  it("rejects external and non-admin destinations", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters-long");
    vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
    const token = await sealGoogleSessionHandoff("owner@example.com", "https://attacker.example");
    await expect(openGoogleSessionHandoff(token)).resolves.toMatchObject({ next: "/admin" });

    const otherAdminToken = await sealGoogleSessionHandoff("other@example.com", "/admin");
    await expect(openGoogleSessionHandoff(otherAdminToken)).rejects.toThrow();
  });
});
