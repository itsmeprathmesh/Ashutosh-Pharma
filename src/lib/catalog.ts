export type CatalogSort = "name" | "price-asc" | "price-desc" | "newest";

export type CatalogFilters = {
  q?: string;
  category?: string;
  form?: string;
  rx?: "yes" | "no" | "";
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
};

export type CatalogRow = {
  name: string;
  generic?: string | null;
  description?: string;
  category: { name: string; slug?: string };
  form?: string | null;
  rx?: boolean;
  priceInr?: { toString(): string } | string | number | null;
  createdAt?: Date | string;
};

export type PublicCatalogRow = CatalogRow & { published: boolean; status: "active" | "review" };

export function filterActivePublished<T extends PublicCatalogRow>(products: T[]): T[] {
  return products.filter((product) => product.status === "active" && product.published);
}

export function filterAndSortCatalog<T extends CatalogRow>(products: T[], filters: CatalogFilters): T[] {
  const query = filters.q?.trim().toLocaleLowerCase("en-IN");
  const filtered = products.filter((product) => {
    if (filters.category && product.category.slug !== filters.category) return false;
    if (filters.form && (product.form ?? "") !== filters.form) return false;
    if (filters.rx === "yes" && !product.rx) return false;
    if (filters.rx === "no" && product.rx) return false;
    if (query && !`${product.name} ${product.generic ?? ""} ${product.description ?? ""}`.toLocaleLowerCase("en-IN").includes(query)) return false;
    const numericPrice = product.priceInr == null ? null : Number(product.priceInr);
    const price = numericPrice !== null && numericPrice > 0 ? numericPrice : null;
    if (filters.minPrice !== undefined && (price === null || price < filters.minPrice)) return false;
    if (filters.maxPrice !== undefined && (price === null || price > filters.maxPrice)) return false;
    return true;
  });

  const sort = filters.sort ?? "name";
  return filtered.sort((a, b) => {
    if (sort === "price-asc" || sort === "price-desc") {
      const aValue = a.priceInr == null ? null : Number(a.priceInr);
      const bValue = b.priceInr == null ? null : Number(b.priceInr);
      const aPrice = aValue !== null && aValue > 0 ? aValue : Number.POSITIVE_INFINITY;
      const bPrice = bValue !== null && bValue > 0 ? bValue : Number.POSITIVE_INFINITY;
      if (!Number.isFinite(aPrice) && Number.isFinite(bPrice)) return 1;
      if (Number.isFinite(aPrice) && !Number.isFinite(bPrice)) return -1;
      return (sort === "price-asc" ? aPrice - bPrice : bPrice - aPrice) || a.name.localeCompare(b.name, "en-IN");
    }
    if (sort === "newest") return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    return a.name.localeCompare(b.name, "en-IN");
  });
}

export function paginateCatalog<T>(products: T[], page: number, pageSize = 24) {
  const totalPages = Math.ceil(products.length / pageSize);
  const safePage = totalPages ? Math.min(Math.max(1, page), totalPages) : 1;
  return {
    page: safePage,
    totalPages,
    total: products.length,
    products: products.slice((safePage - 1) * pageSize, safePage * pageSize),
  };
}

export function hasVisiblePrice(globalEnabled: boolean, productEnabled: boolean, priceInr: unknown): boolean {
  const price = Number(priceInr);
  return globalEnabled && productEnabled && Number.isFinite(price) && price > 0;
}
