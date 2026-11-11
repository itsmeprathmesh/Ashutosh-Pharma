import type { Metadata } from "next";
import { CatalogListing } from "@/components/CatalogListing";
import { isBlocked } from "@/lib/blocked";
import { filterActivePublished, filterAndSortCatalog, hasVisiblePrice, paginateCatalog, type CatalogSort } from "@/lib/catalog";
import { getPricePresentation } from "@/lib/currency";
import { safeDatabaseQuery } from "@/lib/db-safe";
import { getCatalogProducts, getPublicCategoriesWithCounts, getPublicPriceSetting } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Pharmaceutical product catalogue",
  description: "Browse active pharmaceutical products for licensed importers and institutional procurement teams.",
  alternates: { canonical: "/shop" },
};
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; cat?: string; form?: string; rx?: string; min?: string; max?: string; page?: string; sort?: string; view?: string }> };

export default async function Shop({ searchParams }: Props) {
  const search = await searchParams;
  const filters = {
    q: (search.q ?? "").trim().slice(0, 100),
    cat: search.cat ?? "",
    form: (search.form ?? "").slice(0, 80),
    rx: ["yes", "no"].includes(search.rx ?? "") ? search.rx! : "",
    min: search.min && Number.isFinite(Number(search.min)) ? String(Math.max(0, Number(search.min))) : "",
    max: search.max && Number.isFinite(Number(search.max)) ? String(Math.max(0, Number(search.max))) : "",
    sort: (["name", "price-asc", "price-desc", "newest"].includes(search.sort ?? "") ? search.sort : "name") as CatalogSort,
    view: search.view === "list" ? "list" : "grid",
  };
  const requestedPage = Math.max(1, Number.parseInt(search.page ?? "1", 10) || 1);
  const [allRows, categories, globalPriceSwitch] = await Promise.all([
    safeDatabaseQuery(() => getCatalogProducts(), []),
    safeDatabaseQuery(() => getPublicCategoriesWithCounts(), []),
    safeDatabaseQuery(() => getPublicPriceSetting(), false),
  ]);
  const safeRows = filterActivePublished(allRows).filter((product) => !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`)).map((product) => ({
    ...product,
    priceInr: hasVisiblePrice(globalPriceSwitch, product.showPrice, product.priceInr) ? product.priceInr : null,
  }));
  const categoryOptions = categories.map((category) => ({ ...category, _count: { products: safeRows.filter((product) => product.category.slug === category.slug).length } }));
  const matched = filterAndSortCatalog(safeRows, {
    q: filters.q, category: filters.cat, form: filters.form, rx: filters.rx as "yes" | "no" | "",
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
    <section className="page-hero"><div className="container"><span className="eyebrow">For licensed trade buyers</span><h1>Explore the catalogue</h1><p>Product specifications and availability are confirmed with professional buyers. Indicative prices are for reference; final quotes are confirmed in INR.</p></div></section>
    <section className="content-section"><div className="container"><CatalogListing pathname="/shop" products={products} categories={categoryOptions} forms={forms} filters={{ ...filters, page: pageData.page, pages: pageData.totalPages }} maxPriceCap={maxPriceCap} resultCount={pageData.total}/></div></section>
  </main>;
}
