import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

if (!process.env.VERCEL) {
  loadEnv({ path: ".env.local" });
  loadEnv({ path: ".env" });
}

const isMigrationCommand = process.argv.includes("migrate");
const directUrl = process.env.DIRECT_URL?.trim();
if (isMigrationCommand && !directUrl) {
  throw new Error("DIRECT_URL is required for Prisma migrations. Set it to the direct Neon connection string.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma generate does not connect to the database. Do not block Vercel builds
    // when only migration credentials are absent; migrations still require DIRECT_URL.
    url: directUrl || process.env.DATABASE_URL || "postgresql://build:build@localhost:5432/build?schema=public",
  },
});
