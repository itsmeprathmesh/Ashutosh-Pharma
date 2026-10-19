import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { isBlocked } from "@/lib/blocked";
import { safeDatabaseQuery } from "@/lib/db-safe";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ slug: string }> };

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await safeDatabaseQuery(() => db.category.findUnique({ where: { slug } }), null);
  if (!category) notFound();
  const listed = await safeDatabaseQuery(() => db.product.findMany({ where: { categoryId: category.id, published: true }, orderBy: { name: "asc" } }), []);
  const products = listed.filter((product) => !isBlocked(product.name));

  return <main id="main-content"><section className="page-hero"><div className="container"><span className="eyebrow">Product category</span><h1>{category.name}</h1><p>For licensed trade enquiries. Product availability and destination requirements are confirmed by our team.</p></div></section><section className="content-section"><div className="container">{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={{name:product.name,slug:product.slug,imageUrl:product.imageUrl,packSize:product.packSize,category:{name:category.name}}}/>)}</div> : <div className="empty-state">There are no published products in this category yet. <Link className="text-link" href="/contact">Contact our team →</Link></div>}</div></section></main>;
}
import Link from "next/link";
