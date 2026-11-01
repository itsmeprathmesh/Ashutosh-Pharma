import { NextResponse } from "next/server";
import { getPublicCategories } from "@/lib/public-data";
import { safeDatabaseQuery } from "@/lib/db-safe";
export async function GET() {
  const categories = await safeDatabaseQuery(() => getPublicCategories(), []);
  return NextResponse.json({ categories }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
}
