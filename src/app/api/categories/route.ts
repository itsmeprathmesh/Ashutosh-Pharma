import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeDatabaseQuery } from "@/lib/db-safe";
import { getStaticCategories } from "@/lib/catalog-fallback";
export async function GET() {
  const listed = await safeDatabaseQuery(() => db.category.findMany({ where: { products: { some: { published: true, status: "active" } } }, orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }), []);
  const categories = listed.length ? listed : getStaticCategories().map(({ name, slug }) => ({ name, slug }));
  return NextResponse.json({ categories });
}
