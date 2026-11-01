import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { isBlocked } from "@/lib/blocked";
import { db } from "@/lib/db";
import { safeDatabaseQuery } from "@/lib/db-safe";

export const metadata = {
  title: "Pharmaceutical product catalogue",
  description: "Browse the pharmaceutical catalogue for licensed importers and institutional procurement teams.",
  alternates: { canonical: "/shop" },
};
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; cat?: string; page?: string; sort?: string }> };

export default async function Shop({ searchParams }: Props) {
  const { q = "", cat = "", page: rawPage = "1", sort: rawSort = "name" } = await searchParams;
  const query = q.trim().slice(0, 100);
  const requestedPage = Math.max(1, Number.parseInt(rawPage, 10) || 1);
  const sort = rawSort === "newest" ? "newest" : "name";
  const where = {
    published: true,
    status: "active" as const,
    ...(cat ? { category: { slug: cat } } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { generic: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, categories] = await Promise.all([
    safeDatabaseQuery(
      () => db.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          generic: true,
          description: true,
          images: true,
          imageUrl: true,
          packSize: true,
          rx: true,
          createdAt: true,
          category: { select: { name: true } },
        },
        orderBy: sort === "newest" ? { createdAt: "desc" } : { name: "asc" },
      }),
      [],
    ),
    safeDatabaseQuery(
      () => db.category.findMany({
        where: { products: { some: { published: true, status: "active" } } },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      [],
    ),
  ]);

  const visibleRows = rows.filter((product) =>
    !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`),
  );
  const totalPages = Math.ceil(visibleRows.length / 24);
  const page = totalPages ? Math.min(requestedPage, totalPages) : 1;
  const products = visibleRows.slice((page - 1) * 24, page * 24);
  const makeUrl = (nextPage: number) =>
    `/shop?${new URLSearchParams({ ...(query && { q: query }), ...(cat && { cat }), ...(sort !== "name" && { sort }), page: String(nextPage) })}`;

  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">For licensed trade buyers</span>
          <h1>Explore the catalogue</h1>
          <p>Product specifications and availability are confirmed with professional buyers. No public prices or consumer checkout.</p>
        </div>
      </section>
      <section className="content-section">
        <div className="container shop-layout">
          <aside className="shop-sidebar">
            <h2>Browse categories</h2>
            <Link className={!cat ? "active-filter" : ""} href={`/shop${query ? `?q=${encodeURIComponent(query)}` : ""}`}>All products</Link>
            {categories.map((category) => (
              <Link className={cat === category.slug ? "active-filter" : ""} key={category.id} href={`/shop?cat=${category.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                {category.name}
              </Link>
            ))}
          </aside>
          <div>
            <p className="form-note" aria-live="polite">{visibleRows.length} published products</p>
            <form className="catalog-toolbar" action="/shop">
              <input className="field" aria-label="Search products" name="q" defaultValue={query} placeholder="Search the catalogue" />
              <select className="field" name="cat" defaultValue={cat} aria-label="Filter by category">
                <option value="">All categories</option>
                {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
              </select>
              <select className="field" name="sort" defaultValue={sort} aria-label="Sort products">
                <option value="name">Name A–Z</option>
                <option value="newest">New arrivals</option>
              </select>
              <button className="button" type="submit">Search</button>
            </form>
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
                    category: product.category,
                  }} />
                ))}
              </div>
            ) : (
              <div className="empty-state">No published products match this search. Contact us to discuss your sourcing requirements.</div>
            )}
            {totalPages > 1 && (
              <nav className="pagination" aria-label="Product pages">
                {page > 1 && <Link href={makeUrl(page - 1)}>← Previous</Link>}
                <span>Page {page} of {totalPages}</span>
                {page < totalPages && <Link href={makeUrl(page + 1)}>Next →</Link>}
              </nav>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
