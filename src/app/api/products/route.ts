import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBlocked } from "@/lib/blocked";
import { safeDatabaseQuery } from "@/lib/db-safe";
import { z } from "zod";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = z.object({ q: z.string().trim().max(100).optional().default(""), category: z.string().trim().max(100).regex(/^[a-z0-9-]*$/).optional().default("") }).safeParse({ q: url.searchParams.get("q") ?? "", category: url.searchParams.get("category") ?? "" });
  if (!query.success || url.searchParams.getAll("q").length > 1 || url.searchParams.getAll("category").length > 1) return NextResponse.json({ error: "Invalid search request." }, { status: 400 });
  const { q, category } = query.data;
  if (q.length < 2) return NextResponse.json({ products: [] });
  const dbProducts = await safeDatabaseQuery(() => db.product.findMany({
    where: {
      published: true,
      status: "active",
      ...(category ? { category: { slug: category } } : {}),
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { generic: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { name: true, generic: true, description: true, slug: true, imageUrl: true, rx: true, category: { select: { name: true } } }, take: 8, orderBy: { name: "asc" },
  }), []);
  return NextResponse.json(
    { products: dbProducts.filter((product) => !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`)).map(({ name, slug, imageUrl, rx, category }) => ({ name, slug, imageUrl, rx, category })) },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
