import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBlocked } from "@/lib/blocked";
import { safeDatabaseQuery } from "@/lib/db-safe";
import { getStaticProducts } from "@/lib/catalog-fallback";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const category = (url.searchParams.get("category") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ products: [] });
  const dbProducts = await safeDatabaseQuery(() => db.product.findMany({
    where: { published: true, status: "active", name: { contains: q, mode: "insensitive" }, ...(category ? { category: { slug: category } } : {}) },
    select: { name: true, generic: true, description: true, slug: true, imageUrl: true, category: { select: { name: true } } }, take: 8, orderBy: { name: "asc" },
  }), []);
  const products = dbProducts.length ? dbProducts : getStaticProducts()
    .filter((product) => product.name.toLowerCase().includes(q.toLowerCase()) && (!category || product.category.slug === category))
    .slice(0, 8);
  return NextResponse.json({ products: products.filter((product) => !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`)).map(({ name, slug, imageUrl, category }) => ({ name, slug, imageUrl, category })) });
}
