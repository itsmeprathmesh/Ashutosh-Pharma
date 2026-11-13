import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  // Prisma's client is imported while Next.js collects route configuration.
  // Do not require runtime database credentials during that build phase. The
  // public query helpers skip database calls when DATABASE_URL is absent, and
  // production database routes still use the configured DATABASE_URL.
  const connectionString = process.env.DATABASE_URL?.trim()
    || "postgresql://build:build@127.0.0.1:5432/build?schema=public";
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
