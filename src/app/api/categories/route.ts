import { NextResponse } from "next/server";
import { getPublicCategories } from "@/lib/public-data";
import { safeDatabaseQuery } from "@/lib/db-safe";
import { getStaticCategories } from "@/lib/catalog-fallback";
export async function GET() {
  const listed = await safeDatabaseQuery(() => getPublicCategories(), []);
  const categories = listed.length ? listed : getStaticCategories().map(({ name, slug }) => ({ name, slug }));
  return NextResponse.json({ categories }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
}
