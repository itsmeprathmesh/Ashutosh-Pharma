import { test, expect } from "@playwright/test";

test("admin redirects to the custom login page without an HTTP auth challenge", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["www-authenticate"]).toBeUndefined();
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("admin APIs return 401 without a session", async ({ request }) => {
  const response = await request.get("/api/admin/import-template");
  expect(response.status()).toBe(401);
  expect(response.headers()["www-authenticate"]).toBeUndefined();
});

test("login page shows the same generic message for arbitrary invalid credentials", async ({ page }) => {
  await page.goto("/admin/login");
  const attempt = async (email: string) => {
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill("wrong-password");
    await page.getByRole("button", { name: /continue securely/i }).click();
    await expect(page.locator(".admin-login-error")).toHaveText("Invalid details");
    return page.locator(".admin-login-error").innerText();
  };
  const unknownEmail = await attempt(`unlisted-${Date.now()}@invalid.example`);
  const allowedEmailWithWrongPassword = await attempt(process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "owner@example.test");
  expect(allowedEmailWithWrongPassword).toBe(unknownEmail);
});

test("logout clears the session cookie with strict security attributes", async ({ request }) => {
  const response = await request.post("/api/admin/auth/logout", { headers: { Origin: "http://localhost:3100" }, maxRedirects: 0 });
  const cookie = response.headers()["set-cookie"];
  expect(response.status()).toBe(303);
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("Secure");
  expect(cookie?.toLowerCase()).toContain("samesite=strict");
  expect(cookie).toContain("Max-Age=0");
});

test("public page remains accessible without an admin session", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const headers = response?.headers() ?? {};
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-frame-options"]).toBe("DENY");
  const csp = headers["content-security-policy"] ?? "";
  expect(csp).toContain("nonce-");
  expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/i);
  await expect(page).not.toHaveURL(/\/admin\/login/);
});

test("robots and sitemap keep admin and API paths out of search indexes", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/Disallow: \/admin/);
  expect(await robots.text()).toMatch(/Disallow: \/api/);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).not.toContain("/admin");
  expect(xml).not.toContain("/api");
});
