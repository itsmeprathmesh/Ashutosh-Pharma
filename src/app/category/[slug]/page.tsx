import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { isBlocked } from "@/lib/blocked";
import { safeDatabaseQuery } from "@/lib/db-safe";
import Link from "next/link";
import { getStaticCategories, getStaticProducts } from "@/lib/catalog-fallback";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ slug: string }> };

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const dbCategory = await safeDatabaseQuery(() => db.category.findUnique({ where: { slug } }), null);
  const category = dbCategory ?? getStaticCategories().find((item) => item.slug === slug) ?? null;
  if (!category) notFound();
  const dbListed = dbCategory ? await safeDatabaseQuery(() => db.product.findMany({ where: { categoryId: dbCategory.id, published: true, status: "active" }, orderBy: { name: "asc" } }), []) : [];
  const listed = dbListed.length ? dbListed : getStaticProducts().filter((product) => product.category.slug === slug);
  const products = listed.filter((product) => !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`));

  return <main id="main-content"><section className="page-hero"><div className="container"><span className="eyebrow">Product category</span><h1>{category.name}</h1><p>For licensed trade enquiries. Product availability and destination requirements are confirmed by our team.</p></div></section><section className="content-section"><div className="container">{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={{name:product.name,slug:product.slug,imageUrl:product.imageUrl,packSize:product.packSize,rx:product.rx,category:{name:category.name}}}/>)}</div> : <div className="empty-state">There are no published products in this category yet. <Link className="text-link" href="/contact">Contact our team →</Link></div>}</div></section></main>;
}
