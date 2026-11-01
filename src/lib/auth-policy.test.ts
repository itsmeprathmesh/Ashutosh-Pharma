import { describe, expect, it } from "vitest";
import { adminCodeIsUsable, loginIsLocked, sameLoginFailureMessage } from "@/lib/auth-policy";

describe("admin auth policy", () => {
  it("locks on the fifth failed attempt", () => {
    expect(loginIsLocked(4)).toBe(false);
    expect(loginIsLocked(5)).toBe(true);
  });
  it("rejects expired, consumed, and exhausted codes", () => {
    const now = new Date("2026-11-01T00:00:00Z");
    expect(adminCodeIsUsable({ used: false, attempts: 0, expiresAt: new Date(now.getTime() + 1) }, now)).toBe(true);
    expect(adminCodeIsUsable({ used: false, attempts: 0, expiresAt: now }, now)).toBe(false);
    expect(adminCodeIsUsable({ used: true, attempts: 0, expiresAt: new Date(now.getTime() + 1) }, now)).toBe(false);
    expect(adminCodeIsUsable({ used: false, attempts: 5, expiresAt: new Date(now.getTime() + 1) }, now)).toBe(false);
  });
  it("uses one identical credential failure message", () => {
    expect(sameLoginFailureMessage()).toBe(sameLoginFailureMessage());
    expect(sameLoginFailureMessage()).toBe("Invalid details");
  });
});
