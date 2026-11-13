"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export type CatalogCategoryOption = { id: number | string; name: string; slug: string; _count: { products: number } };

export function CatalogFilterPanel({
  pathname,
  query,
  category,
  form,
  rx,
  minPrice,
  maxPrice,
  maxPriceCap,
  categories,
  forms,
  view,
}: {
  pathname: string; query: string; category: string; form: string; rx: string; minPrice: string; maxPrice: string;
  maxPriceCap: number; categories: CatalogCategoryOption[]; forms: string[]; view: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(query);
  const [suggestions, setSuggestions] = useState<{ name: string; slug: string; category: { name: string } }[]>([]);
  const low = Number(minPrice) || 0;
  const high = Number(maxPrice) || maxPriceCap;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim().length < 2) { setSuggestions([]); return; }
      fetch(`/api/products?q=${encodeURIComponent(search)}${category ? `&category=${encodeURIComponent(category)}` : ""}`)
        .then((response) => response.json())
        .then((data) => setSuggestions(data.products ?? []))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, category]);

  useEffect(() => {
    if (search.trim() === query) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (!pathname.startsWith("/category/") && category) params.set("cat", category);
      if (form) params.set("form", form);
      if (rx) params.set("rx", rx);
      if (minPrice) params.set("min", minPrice);
      if (maxPrice) params.set("max", maxPrice);
      if (view && view !== "grid") params.set("view", view);
      const destination = `${pathname}${params.size ? `?${params.toString()}` : ""}`;
      router.replace(destination, { scroll: false });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [search, query, pathname, category, form, rx, minPrice, maxPrice, view, router]);

  const categoryHref = useMemo(() => (slug: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (form) params.set("form", form);
    if (rx) params.set("rx", rx);
    if (minPrice) params.set("min", minPrice);
    if (maxPrice) params.set("max", maxPrice);
    if (view) params.set("view", view);
    if (slug && !pathname.startsWith("/category/")) params.set("cat", slug);
    const searchParams = params.toString();
    const destination = pathname.startsWith("/category/") ? (slug ? `/category/${slug}` : "/shop") : pathname;
    return `${destination}${searchParams ? `?${searchParams}` : ""}`;
  }, [pathname, query, form, rx, minPrice, maxPrice, view]);

  const filterAction = pathname.startsWith("/category/") ? "/shop" : pathname;
  const filters = <form action={filterAction} method="get" className="catalog-filter-form">
    <label>Search products<input className="field" name="q" value={search} onChange={(event) => setSearch(event.target.value)} list="catalog-suggestions" placeholder="Name or generic" autoComplete="off"/><datalist id="catalog-suggestions">{suggestions.map((item) => <option key={item.slug} value={item.name}>{item.category.name}</option>)}</datalist></label>
    <label>Category<select className="field" name="cat" defaultValue={category}><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name} ({item._count.products})</option>)}</select></label>
    <label>Dosage form<select className="field" name="form" defaultValue={form}><option value="">All forms</option>{forms.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    <label>Prescription<select className="field" name="rx" defaultValue={rx}><option value="">Any</option><option value="yes">Prescription required</option><option value="no">No prescription flag</option></select></label>
    <fieldset className="catalog-price-range"><legend>INR price range</legend><label>From ₹{low.toLocaleString("en-IN")}<input type="range" name="min" min="0" max={maxPriceCap} step="100" defaultValue={low}/></label><label>To ₹{high.toLocaleString("en-IN")}<input type="range" name="max" min="0" max={maxPriceCap} step="100" defaultValue={high}/></label><small>Products without an INR price are excluded when a range is set.</small></fieldset>
    <input type="hidden" name="view" value={view}/>
    <button className="button button-small" type="submit">Apply filters</button>
    <Link className="text-link" href={pathname}>Clear filters</Link>
  </form>;

  return <>
    <aside className="catalog-filters catalog-filters-desktop"><h2>Filter products</h2><nav className="catalog-category-links" aria-label="Category filters"><Link className={!category ? "active-filter" : ""} href={categoryHref("")}>All categories <small>{categories.reduce((total, item) => total + item._count.products, 0).toLocaleString("en-IN")}</small></Link>{categories.map((item) => <Link className={category === item.slug ? "active-filter" : ""} key={item.id} href={categoryHref(item.slug)}>{item.name}<small>{item._count.products.toLocaleString("en-IN")}</small></Link>)}</nav>{filters}</aside>
    <button className="catalog-mobile-filter-button button button-outline" onClick={() => setOpen(true)}><SlidersHorizontal size={16}/> Filters</button>
    {open && <div className="catalog-filter-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="catalog-filter-drawer" role="dialog" aria-modal="true" aria-label="Filter products"><div className="catalog-filter-drawer-heading"><h2>Filter products</h2><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close filters"><X size={18}/></button></div>{filters}</section></div>}
  </>;
}
