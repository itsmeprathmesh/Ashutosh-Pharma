import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { isBlocked } from "../src/lib/blocked";

type SourceProduct = {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  price?: { amount?: number; unit?: string };
  status?: "active" | "review";
  statusNote?: string;
  rx?: boolean;
  strength?: string;
  packSize?: string;
  form?: string;
  composition?: string;
  sourceRow?: number;
};

type SourceGroup = {
  category: string;
  slug: string;
  count: number;
  products: SourceProduct[];
};

const dryRun = process.argv.includes("--dry-run");
const overwrite = process.argv.includes("--overwrite");
const connectionString = process.env.DATABASE_URL;
const prisma = dryRun || !connectionString ? null : new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  // Only read the approved source file. Do not import excluded-products.json.
  const groups = JSON.parse(await readFile("data/products.json", "utf8")) as SourceGroup[];
  const eligible: Array<{ group: SourceGroup; product: SourceProduct }> = [];
  const skipped: string[] = [];

  for (const group of groups) {
    for (const product of group.products) {
      if (isBlocked(`${product.name} ${product.composition ?? ""} ${product.description ?? ""} ${group.category}`)) {
        skipped.push(product.name);
        continue;
      }
      eligible.push({ group, product });
    }
  }

  let categoriesCreated = 0;
  let productsCreated = 0;
  let productsUpdated = 0;
  let activeCount = 0;
  let reviewCount = 0;

  if (dryRun) {
    categoriesCreated = groups.length;
    productsCreated = eligible.length;
    for (const { product } of eligible) {
      const patentRestricted = /mounjaro|tirzepatide/i.test(`${product.name} ${product.composition ?? ""}`);
      if (product.status === "active" && !patentRestricted) activeCount++;
      else reviewCount++;
    }
  } else {
    if (!prisma) throw new Error("DATABASE_URL is not configured.");

    for (const [sortOrder, group] of groups.entries()) {
      const existingCategory = await prisma.category.findUnique({ where: { slug: group.slug }, select: { id: true } });
      const category = await prisma.category.upsert({
        where: { slug: group.slug },
        create: { name: group.category, slug: group.slug, sortOrder },
        update: { name: group.category, sortOrder },
      });
      if (!existingCategory) categoriesCreated++;

      for (const product of group.products) {
        if (isBlocked(`${product.name} ${product.composition ?? ""} ${product.description ?? ""} ${group.category}`)) continue;

        const patentRestricted = /mounjaro|tirzepatide/i.test(`${product.name} ${product.composition ?? ""}`);
        const status: "active" | "review" = product.status === "active" && !patentRestricted ? "active" : "review";
        const statusNote = patentRestricted
          ? "Patent restricted: do not publish without legal review."
          : product.statusNote ?? null;
        const images = product.images ?? [];
        const createData: Prisma.ProductUncheckedCreateInput = {
          name: product.name,
          slug: product.id,
          description: product.description ?? `${product.name} supplied to licensed importers.`,
          images,
          imageUrl: images[0] ?? null,
          priceInr: product.price?.amount ?? null,
          priceUnit: product.price?.unit ?? null,
          status,
          statusNote,
          published: status === "active",
          rx: product.rx ?? true,
          strength: product.strength ?? null,
          packSize: product.packSize ?? null,
          form: product.form ?? null,
          generic: product.composition ?? null,
          sourceRow: product.sourceRow ?? null,
          patentRestricted,
          categoryId: category.id,
        };

        const existingProduct = await prisma.product.findUnique({ where: { slug: product.id }, select: { id: true } });
        const updateData: Prisma.ProductUncheckedUpdateInput = {
          name: createData.name,
          priceInr: createData.priceInr,
          priceUnit: createData.priceUnit,
          status: createData.status,
          statusNote: createData.statusNote,
          rx: createData.rx,
          strength: createData.strength,
          packSize: createData.packSize,
          form: createData.form,
          generic: createData.generic,
          sourceRow: createData.sourceRow,
          patentRestricted: createData.patentRestricted,
          categoryId: createData.categoryId,
          ...(overwrite
            ? {
                description: createData.description,
                images: createData.images,
                imageUrl: createData.imageUrl,
                published: createData.published,
              }
            : {}),
        };

        await prisma.product.upsert({
          where: { slug: product.id },
          create: createData,
          update: updateData,
        });

        if (existingProduct) productsUpdated++;
        else productsCreated++;
        if (status === "active") activeCount++;
        else reviewCount++;
      }
    }
  }

  console.log(JSON.stringify({
    mode: dryRun ? "dry-run" : overwrite ? "overwrite" : "import",
    databaseWrites: !dryRun,
    ...(dryRun ? { countsAssumeEmptyDatabase: true } : {}),
    categoriesCreated,
    productsCreated,
    productsUpdated,
    productsSkipped: skipped.length,
    activeCount,
    reviewCount,
    skippedProducts: skipped,
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error("Catalogue import failed.", error instanceof Error ? error.name : "unknown");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
