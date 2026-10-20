import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { isBlocked } from "../src/lib/blocked";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");
const overwrite = process.argv.includes("--overwrite");
type SourceProduct = { id: string; name: string; description?: string; images?: string[]; price?: { amount?: number; unit?: string }; status?: "active" | "review"; statusNote?: string; rx?: boolean; strength?: string; packSize?: string; composition?: string; form?: string; sourceRow?: number };
type Group = { category: string; slug: string; products: SourceProduct[] };

async function main() {
  const groups = JSON.parse(await readFile("data/products.json", "utf8")) as Group[];
  const skipped: string[] = [];
  let candidates = 0, created = 0, updated = 0;
  for (const [sortOrder, group] of groups.entries()) {
    for (const product of group.products) {
      if (isBlocked(`${product.name} ${product.composition ?? ""} ${product.description ?? ""} ${group.category}`)) {
        skipped.push(product.name);
        continue;
      }
      candidates++;
    }
    if (dryRun) continue;
    const category = await prisma.category.upsert({ where: { slug: group.slug }, update: { name: group.category, sortOrder }, create: { name: group.category, slug: group.slug, sortOrder } });
    for (const product of group.products) {
      if (isBlocked(`${product.name} ${product.composition ?? ""} ${product.description ?? ""} ${group.category}`)) continue;
      const status: "active" | "review" = product.status === "active" ? "active" : "review";
      const patentRestricted = /tirzepatide|mounjaro/i.test(`${product.name} ${product.composition ?? ""}`);
      const data = {
        name: product.name, slug: product.id, description: product.description ?? `${product.name} supplied to licensed importers.`,
        imageUrl: product.images?.[0] ?? null, images: product.images ?? [], priceInr: product.price?.amount ?? null,
        priceUnit: product.price?.unit ?? null, status: patentRestricted ? "review" as const : status,
        statusNote: patentRestricted ? "Patent restricted: do not publish without legal clearance" : product.statusNote ?? null,
        published: status === "active" && !patentRestricted, rx: product.rx ?? true,
        strength: product.strength ?? null, packSize: product.packSize ?? null, generic: product.composition ?? null,
        patentRestricted, categoryId: category.id, sourceRow: product.sourceRow ?? null,
      };
      const existing = await prisma.product.findUnique({ where: { slug: product.id }, select: { id: true } });
      if (!existing) { await prisma.product.create({ data }); created++; }
      else if (overwrite) { await prisma.product.update({ where: { id: existing.id }, data }); updated++; }
    }
  }
  console.log(JSON.stringify({ dryRun, categories: groups.length, sourceProducts: groups.reduce((sum, group) => sum + group.products.length, 0), eligibleProducts: candidates, created: dryRun ? candidates : created, updated, skippedCount: skipped.length, skipped }, null, 2));
}
main().finally(() => prisma.$disconnect());
