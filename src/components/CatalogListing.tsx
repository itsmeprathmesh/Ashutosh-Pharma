import Link from "next/link";
import { ProductCard, AddProductButton, type CatalogProduct } from "@/components/ProductCard";
import { CatalogFilterPanel, type CatalogCategoryOption } from "@/components/CatalogFilterPanel";

export type CatalogListingProduct = CatalogProduct & {
  id: number;
  strength: string | null;
  packSize: string | null;
  form: string | null;
  rx: boolean;
};

type Filters = { q: string; cat: string; form: string; rx: string; min: string; max: string; sort: string; view: string; page?: number; pages?: number };

function pageUrl(pathname: string, filters: Filters, page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.cat) params.set("cat", filters.cat);
  if (filters.form) params.set("form", filters.form);
  if (filters.rx) params.set("rx", filters.rx);
  if (filters.min) params.set("min", filters.min);
  if (filters.max) params.set("max", filters.max);
  if (filters.sort && filters.sort !== "name") params.set("sort", filters.sort);
  if (filters.view && filters.view !== "grid") params.set("view", filters.view);
  params.set("page", String(page));
  return `${pathname}?${params.toString()}`;
}

export function CatalogListing({
  pathname, products, categories, forms, filters, maxPriceCap, resultCount,
}: {
  pathname: string; products: CatalogListingProduct[]; categories: CatalogCategoryOption[]; forms: string[]; filters: Filters; maxPriceCap: number; resultCount: number;
}) {
  const listView = filters.view === "list";
  const sortLabel: Record<string, string> = { name: "Name A–Z", "price-asc": "Price: low to high", "price-desc": "Price: high to low", newest: "Newest" };
  return <div className="catalog-layout">
    <CatalogFilterPanel pathname={pathname} query={filters.q} category={filters.cat} form={filters.form} rx={filters.rx} minPrice={filters.min} maxPrice={filters.max} maxPriceCap={maxPriceCap} categories={categories} forms={forms} view={filters.view}/>
    <section className="catalog-results" aria-label="Catalogue products">
      <div className="catalog-results-toolbar"><p aria-live="polite"><strong>{resultCount.toLocaleString("en-IN")}</strong> products found</p><form action={pathname} method="get" className="catalog-sort-form">{filters.q && <input type="hidden" name="q" value={filters.q}/ >}{filters.cat && <input type="hidden" name="cat" value={filters.cat}/ >}{filters.form && <input type="hidden" name="form" value={filters.form}/ >}{filters.rx && <input type="hidden" name="rx" value={filters.rx}/ >}{filters.min && <input type="hidden" name="min" value={filters.min}/ >}{filters.max && <input type="hidden" name="max" value={filters.max}/ >}<label>Sort <select className="field" name="sort" defaultValue={filters.sort} onChange={(event) => event.currentTarget.form?.requestSubmit()}>{Object.entries(sortLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><input type="hidden" name="view" value={filters.view}/></form><div className="catalog-view-toggle" aria-label="View style"><Link aria-current={!listView ? "page" : undefined} href={pageUrl(pathname, { ...filters, view: "grid" }, 1)}>Grid</Link><Link aria-current={listView ? "page" : undefined} href={pageUrl(pathname, { ...filters, view: "list" }, 1)}>List</Link></div></div>
      {products.some((product) => product.price) && <p className="price-disclaimer catalog-price-disclaimer">Indicative wholesale prices in INR, excluding GST, shipping and duties. Final quote on request.</p>}
      {products.length ? listView ? <div className="catalog-table-wrap"><table className="catalog-table"><thead><tr><th>Product</th><th>Strength</th><th>Pack</th><th>Form</th><th>Price</th><th><span className="sr-only">Enquiry</span></th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><th scope="row"><Link href={`/product/${product.slug}`}>{product.name}</Link><small>{product.category.name}</small></th><td>{product.strength || "—"}</td><td>{product.packSize || "—"}</td><td>{product.form || "—"}</td><td className="catalog-table-price">{product.price?.inr ?? "—"}</td><td><AddProductButton product={product}/></td></tr>)}</tbody></table></div> : <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="empty-state catalog-empty-state"><h2>No matching products</h2><p>Try a different category, dosage form or price range. You can also send us a sourcing enquiry.</p><Link className="button" href="/contact">Ask about a product</Link></div>}
      {Number(filters.pages ?? 0) > 1 && <nav className="pagination" aria-label="Catalogue pages"><span>Page {filters.page ?? 1} of {filters.pages ?? 1}</span>{Number(filters.page ?? 1) > 1 && <Link href={pageUrl(pathname, filters, Number(filters.page ?? 1) - 1)}>← Previous</Link>}{Number(filters.page ?? 1) < Number(filters.pages ?? 1) && <Link href={pageUrl(pathname, filters, Number(filters.page ?? 1) + 1)}>Next →</Link>}</nav>}
    </section>
  </div>;
}
