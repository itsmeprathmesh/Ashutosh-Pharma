import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { isBlocked } from "@/lib/blocked";
import { safeDatabaseQuery } from "@/lib/db-safe";
import { getPublicCategory, getPublicCategoryProductCount, getPublicCategoryProducts } from "@/lib/public-data";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const requestedPage = Math.max(1, Number.parseInt(search.page ?? "1", 10) || 1);
  const category = await safeDatabaseQuery(() => getPublicCategory(slug), null);
  if (!category) notFound();

  const dbCount = await safeDatabaseQuery(() => getPublicCategoryProductCount(category.id), 0);
  const totalPages = Math.ceil(dbCount / 24);
  const page = totalPages ? Math.min(requestedPage, totalPages) : 1;
  const listed = dbCount
    ? await safeDatabaseQuery(() => getPublicCategoryProducts(category.id, (page - 1) * 24), [])
    : [];
  const products = listed.filter((product) =>
    !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`),
  );

  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Product category</span>
          <h1>{category.name}</h1>
          <p>For licensed trade enquiries. Product availability and destination requirements are confirmed by our team.</p>
        </div>
      </section>
      <section className="content-section">
        <div className="container">
          {products.length ? (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={{
                  name: product.name,
                  slug: product.slug,
                  images: product.images,
                  imageUrl: product.imageUrl,
                  packSize: product.packSize,
                  rx: product.rx,
                  category: { name: category.name },
                }} />
              ))}
            </div>
          ) : (
            <div className="empty-state">There are no published products in this category yet. <Link className="text-link" href="/contact">Contact our team →</Link></div>
          )}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Category product pages">
              {page > 1 && <Link href={`/category/${slug}?page=${page - 1}`}>← Previous</Link>}
              <span>Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={`/category/${slug}?page=${page + 1}`}>Next →</Link>}
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}
