import { defineConfig } from "@playwright/test";
import fs from "node:fs";

function loadTestEnv() {
  const file = ".env.test";
  if (!fs.existsSync(file)) throw new Error("Missing .env.test; refusing to run browser tests without test-only configuration.");
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  const url = new URL(process.env.SITE_URL ?? "");
  if (url.hostname !== "localhost") throw new Error("Refusing write tests: SITE_URL must be localhost.");
  const db = new URL(process.env.DATABASE_URL ?? "");
  if (!(["localhost", "127.0.0.1", "::1"].includes(db.hostname)) || !db.pathname.toLowerCase().includes("test")) throw new Error("Refusing tests: DATABASE_URL must target a localhost test database.");
}
loadTestEnv();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  reporter: "list",
  use: { baseURL: process.env.SITE_URL, browserName: "chromium", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1366, height: 800 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100", url: "http://127.0.0.1:3100", reuseExistingServer: !process.env.CI, timeout: 120_000, gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 } },
});
