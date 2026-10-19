import type { MetadataRoute } from "next";
import { countries } from "@/data/countries";
import { db } from "@/lib/db";
import { isBlocked } from "@/lib/blocked";
import { safeDatabaseQuery } from "@/lib/db-safe";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [products, categories] = await Promise.all([
    safeDatabaseQuery(() => db.product.findMany({ where: { published: true }, select: { slug: true, name: true, createdAt: true } }), []),
    safeDatabaseQuery(() => db.category.findMany({ select: { slug: true } }), []),
  ]);
  const fixed = ["", "/shop", "/about", "/contact", "/oncology", "/blog", "/privacy", "/terms", "/refund-policy", "/pt-br/export/brazil"].map((path) => ({ url: `${base}${path}` }));
  const exports = countries.map((country) => ({ url: `${base}/export/${country.slug}` }));
  const categoryPages = categories.map(({ slug }) => ({ url: `${base}/category/${slug}` }));
  const productPages = products.filter(({ name }) => !isBlocked(name)).map(({ slug, createdAt }) => ({ url: `${base}/product/${slug}`, lastModified: createdAt }));
  const posts = await safeDatabaseQuery(() => db.blogPost.findMany({ where: { published: true }, select: { slug: true, createdAt: true } }), []);
  const blogPages = posts.map(({ slug, createdAt }) => ({ url: `${base}/blog/${slug}`, lastModified: createdAt }));
  return [...fixed, ...exports, ...categoryPages, ...productPages, ...blogPages];
}
