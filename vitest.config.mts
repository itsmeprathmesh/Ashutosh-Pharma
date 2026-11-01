import { defineConfig } from "vitest/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
if (!fs.existsSync(path.join(rootDir, ".env.test"))) throw new Error("Missing .env.test; tests require isolated test-only configuration.");
loadEnv({ path: path.join(rootDir, ".env.test") });
const testSite = new URL(process.env.SITE_URL ?? "");
const testDatabase = new URL(process.env.DATABASE_URL ?? "");
if (testSite.hostname !== "localhost" || !["localhost", "127.0.0.1", "::1"].includes(testDatabase.hostname) || !testDatabase.pathname.toLowerCase().includes("test")) {
  throw new Error("Refusing to run tests without a localhost test database and site URL.");
}

export default defineConfig({
  resolve: { alias: { "@": path.resolve(rootDir, "src") } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
