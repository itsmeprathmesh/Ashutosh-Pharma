import { PrismaClient } from "@prisma/client";

const siteUrl = new URL(process.env.SITE_URL ?? "");
const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
if (siteUrl.hostname !== "localhost" || !["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname) || !databaseUrl.pathname.toLowerCase().includes("test")) {
  throw new Error("Seed refused: only a localhost test database is allowed.");
}

const prisma = new PrismaClient();
async function main() {
  try {
    const category = await prisma.category.upsert({ where: { slug: "test-fixtures" }, update: {}, create: { name: "Test fixtures", slug: "test-fixtures" } });
    await prisma.product.upsert({
      where: { slug: "test-catalogue-fixture" },
      update: { published: true, categoryId: category.id },
      create: { name: "Test catalogue fixture", slug: "test-catalogue-fixture", description: "Synthetic record for automated tests only; not a commercial product.", rx: false, categoryId: category.id },
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Test database seed failed.", error);
  process.exitCode = 1;
});
