import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogListing } from "@/components/CatalogListing";
import { isBlocked } from "@/lib/blocked";
import { filterActivePublished, filterAndSortCatalog, hasVisiblePrice, paginateCatalog, type CatalogSort } from "@/lib/catalog";
import { getPricePresentation } from "@/lib/currency";
import { safeDatabaseQuery } from "@/lib/db-safe";
import { getCatalogProducts, getPublicCategoriesWithCounts, getPublicCategory, getPublicPriceSetting } from "@/lib/public-data";

export const dynamic = "force-dynamic";
type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; form?: string; rx?: string; min?: string; max?: string; page?: string; sort?: string; view?: string }>;
};

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const category = await safeDatabaseQuery(() => getPublicCategory(slug), null);
  if (!category) notFound();
  const filters = {
    q: (search.q ?? "").trim().slice(0, 100), cat: slug, form: (search.form ?? "").slice(0, 80),
    rx: ["yes", "no"].includes(search.rx ?? "") ? search.rx! : "",
    min: search.min && Number.isFinite(Number(search.min)) ? String(Math.max(0, Number(search.min))) : "",
    max: search.max && Number.isFinite(Number(search.max)) ? String(Math.max(0, Number(search.max))) : "",
    sort: (["name", "price-asc", "price-desc", "newest"].includes(search.sort ?? "") ? search.sort : "name") as CatalogSort,
    view: search.view === "list" ? "list" : "grid",
  };
  const requestedPage = Math.max(1, Number.parseInt(search.page ?? "1", 10) || 1);
  const [catalogRows, categories, globalPriceSwitch] = await Promise.all([
    safeDatabaseQuery(() => getCatalogProducts(), []),
    safeDatabaseQuery(() => getPublicCategoriesWithCounts(), []),
    safeDatabaseQuery(() => getPublicPriceSetting(), false),
  ]);
  const publicRows = filterActivePublished(catalogRows);
  const allRows = publicRows.filter((product) => product.category.slug === slug);
  const safeRows = allRows.filter((product) => !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`)).map((product) => ({
    ...product,
    priceInr: hasVisiblePrice(globalPriceSwitch, product.showPrice, product.priceInr) ? product.priceInr : null,
  }));
  const visibleCatalogRows = publicRows.filter((product) => !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`));
  const categoryOptions = categories.map((item) => ({ ...item, _count: { products: visibleCatalogRows.filter((product) => product.category.slug === item.slug).length } }));
  const matched = filterAndSortCatalog(safeRows, {
    q: filters.q, form: filters.form, rx: filters.rx as "yes" | "no" | "",
    ...(filters.min ? { minPrice: Number(filters.min) } : {}), ...(filters.max ? { maxPrice: Number(filters.max) } : {}), sort: filters.sort,
  });
  const pageData = paginateCatalog(matched, requestedPage, 24);
  const priceValues = safeRows.flatMap((product) => product.priceInr === null ? [] : [Number(product.priceInr)]).filter(Number.isFinite);
  const maxPriceCap = Math.max(1000, Math.ceil(Math.max(...priceValues, 0) / 1000) * 1000);
  const products = await Promise.all(pageData.products.map(async (product) => ({
    ...product,
    price: getPricePresentation({ globalEnabled: globalPriceSwitch, productEnabled: product.showPrice, priceInr: product.priceInr, priceUnit: product.priceUnit }),
  })));
  const forms = [...new Set(allRows.map((product) => product.form?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));

  return <main id="main-content">
    <section className="page-hero"><div className="container"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/shop">Shop</Link><span>/</span><span aria-current="page">{category.name}</span></nav><span className="eyebrow">Product category · {safeRows.length.toLocaleString("en-IN")} products</span><h1>{category.name}</h1>{category.description ? <p>{category.description}</p> : <p>For licensed trade enquiries. Product availability and destination requirements are confirmed by our team.</p>}</div></section>
    <section className="content-section"><div className="container"><CatalogListing pathname={`/category/${slug}`} products={products} categories={categoryOptions} forms={forms} filters={{ ...filters, page: pageData.page, pages: pageData.totalPages }} maxPriceCap={maxPriceCap} resultCount={pageData.total}/></div></section>
  </main>;
}
