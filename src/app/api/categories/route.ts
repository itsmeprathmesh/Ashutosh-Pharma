import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeDatabaseQuery } from "@/lib/db-safe";
export async function GET() {
  const categories = await safeDatabaseQuery(() => db.category.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } }), []);
  return NextResponse.json({ categories });
}
