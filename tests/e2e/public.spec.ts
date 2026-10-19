import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of ["/", "/shop", "/about", "/contact", "/blog", "/oncology", "/terms", "/refund-policy", "/privacy", "/export/united-states", "/pt-br/export/brazil"]) {
  test(`${route} renders cleanly and passes axe`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    expect(await page.locator("body").innerText()).not.toMatch(/lorem ipsum|\bundefined\b|\bnull\b/i);
    await expect(page.locator("body")).not.toContainText(/add to cart|checkout button|checkout now|\$\s?\d/);
    await expect(page.getByRole("button", { name: /add to cart|checkout/i })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(result.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);
  });
}

test("bad URLs return a proper not found page", async ({ page }) => {
  expect((await page.goto("/this-route-should-not-exist"))?.status()).toBe(404);
});
