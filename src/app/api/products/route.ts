import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBlocked } from "@/lib/blocked";
import { safeDatabaseQuery } from "@/lib/db-safe";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const category = (url.searchParams.get("category") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ products: [] });
  const products = await safeDatabaseQuery(() => db.product.findMany({
    where: { published: true, name: { contains: q, mode: "insensitive" }, ...(category ? { category: { slug: category } } : {}) },
    select: { name: true, slug: true, imageUrl: true, category: { select: { name: true } } }, take: 8, orderBy: { name: "asc" },
  }), []);
  return NextResponse.json({ products: products.filter((product) => !isBlocked(product.name)) });
}
