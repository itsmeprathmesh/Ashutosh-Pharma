import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isBlocked } from "../src/lib/blocked";

type Product = { id: string; name: string; composition?: string; description?: string; status: "active" | "review"; images?: string[] };
type Group = { category: string; slug: string; products: Product[] };
async function main() {
const groups = JSON.parse(await readFile("data/products.json", "utf8")) as Group[];
const publicFiles = [
  "src/app/page.tsx", "src/app/shop/page.tsx", "src/app/category/[slug]/page.tsx",
  "src/app/product/[slug]/page.tsx", "src/components/ProductCard.tsx", "src/app/api/products/route.ts",
];
const rows = groups.flatMap((group) => group.products.map((product) => ({ ...product, category: group.category })));
const eligible = rows.filter((product) => !isBlocked(`${product.name} ${product.composition ?? ""} ${product.description ?? ""} ${product.category}`));
const published = eligible.filter((product) => product.status === "active");
const review = eligible.filter((product) => product.status === "review");
assert.equal(groups.length, 18, "expected 18 source categories");
assert.equal(rows.length, 523, "expected 523 source products");
assert.equal(new Set(rows.map((product) => product.id)).size, rows.length, "product slugs must be unique");
assert.ok(published.every((product) => product.status === "active"), "published source products must have active status");
for (const group of groups) {
  const active = group.products.filter((product) => product.status === "active" && !isBlocked(`${product.name} ${product.composition ?? ""} ${product.description ?? ""} ${group.category}`));
  const sourceActive = group.products.filter((product) => product.status === "active").length;
  assert.ok(sourceActive === 0 || active.length > 0, `active category ${group.category} must have at least one safe published product`);
}
for (const file of publicFiles) {
  const source = await readFile(file, "utf8");
  assert.doesNotMatch(source, /\b(?:priceInr|priceUnit|statusNote|sourceRow)\b/, `${file} must not render internal catalogue fields`);
}
console.log(`Catalogue source: ${groups.length} categories, ${rows.length} products; ${eligible.length} pass the shared safety filter (${published.length} active, ${review.length} review); ${rows.length - eligible.length} skipped.`);
for (const group of groups) {
  const safe = group.products.filter((product) => !isBlocked(`${product.name} ${product.composition ?? ""} ${product.description ?? ""} ${group.category}`));
  console.log(`${group.category}: ${safe.filter((product) => product.status === "active").length} active, ${safe.filter((product) => product.status === "review").length} review`);
}
console.log("Public pages do not reference internal price/review/source fields.");

}
main().catch((error) => { console.error(error); process.exitCode = 1; });
