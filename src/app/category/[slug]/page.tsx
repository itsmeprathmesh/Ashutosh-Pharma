import { notFound } from "next/navigation";
import { getPublicCategory, getPublicCategoryProductCount, getPublicCategoryProducts } from "@/lib/public-data";
import { ProductCard } from "@/components/ProductCard";
import { isBlocked } from "@/lib/blocked";
import { safeDatabaseQuery } from "@/lib/db-safe";
import Link from "next/link";
import { getStaticCategories, getStaticProducts } from "@/lib/catalog-fallback";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const requestedPage = Math.max(1, Number.parseInt(search.page ?? "1", 10) || 1);
  const dbCategory = await safeDatabaseQuery(() => getPublicCategory(slug), null);
  const category = dbCategory ?? getStaticCategories().find((item) => item.slug === slug) ?? null;
  if (!category) notFound();
  const dbCount = dbCategory ? await safeDatabaseQuery(() => getPublicCategoryProductCount(dbCategory.id), 0) : 0;
  const pageCount = dbCount > 0 ? Math.ceil(dbCount / 24) : 0;
  const page = pageCount ? Math.min(requestedPage, pageCount) : requestedPage;
  const dbListed = dbCategory && dbCount > 0 ? await safeDatabaseQuery(() => getPublicCategoryProducts(dbCategory.id, (page - 1) * 24), []) : [];
  const staticProducts = dbCount > 0 ? [] : getStaticProducts().filter((product) => product.category.slug === slug);
  const listed = dbCount > 0 ? dbListed : staticProducts.slice((page - 1) * 24, page * 24);
  const products = listed.filter((product) => !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`));
  const totalPages = pageCount || Math.ceil(staticProducts.filter((product) => !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`)).length / 24);

  return <main id="main-content"><section className="page-hero"><div className="container"><span className="eyebrow">Product category</span><h1>{category.name}</h1><p>For licensed trade enquiries. Product availability and destination requirements are confirmed by our team.</p></div></section><section className="content-section"><div className="container">{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={{name:product.name,slug:product.slug,imageUrl:product.imageUrl,packSize:product.packSize,rx:product.rx,category:{name:category.name}}}/>)}</div> : <div className="empty-state">There are no published products in this category yet. <Link className="text-link" href="/contact">Contact our team →</Link></div>}{totalPages > 1 && <nav className="pagination" aria-label="Category product pages">{page > 1 && <Link href={`/category/${slug}?page=${page - 1}`}>← Previous</Link>}<span>Page {page} of {totalPages}</span>{page < totalPages && <Link href={`/category/${slug}?page=${page + 1}`}>Next →</Link>}</nav>}</div></section></main>;
}
