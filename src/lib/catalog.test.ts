import { describe, expect, it } from "vitest";
import { filterActivePublished, filterAndSortCatalog, hasVisiblePrice, paginateCatalog } from "@/lib/catalog";
import { getPricePresentation } from "@/lib/currency";

const activeProducts = Array.from({ length: 53 }, (_, index) => ({
  id: index + 1,
  status: "active" as const,
  published: true,
  name: `Medicine ${String(index + 1).padStart(2, "0")}`,
  slug: `medicine-${index + 1}`,
  generic: index % 2 ? "Generic A" : "Generic B",
  description: "Trade catalogue item",
  category: { name: index % 2 ? "Tablets" : "Injectables", slug: index % 2 ? "tablets" : "injectables" },
  form: index % 2 ? "Tablet" : "Vial",
  rx: index % 3 === 0,
  priceInr: index === 0 ? "0" : String(100 + index * 100),
  createdAt: new Date(2026, 0, index + 1),
}));

describe("catalog listing behavior", () => {
  it("includes all active rows across 24 item pages without duplicates", () => {
    const mixedRows = [...activeProducts, { ...activeProducts[0], id: 54, status: "review" as const }, { ...activeProducts[1], id: 55, published: false }];
    const visible = filterActivePublished(mixedRows);
    const pages = [1, 2, 3].map((page) => paginateCatalog(visible, page, 24));
    const combined = pages.flatMap((result) => result.products);
    expect(combined).toHaveLength(activeProducts.length);
    expect(new Set(combined.map((product) => product.id)).size).toBe(activeProducts.length);
    expect(pages.map((result) => result.products.length)).toEqual([24, 24, 5]);
  });

  it("does not return hidden or zero prices for rendering", () => {
    expect(hasVisiblePrice(false, true, "1200")).toBe(false);
    expect(getPricePresentation({ globalEnabled: false, productEnabled: true, priceInr: "1200", priceUnit: "vial" })).toBeNull();
    expect(hasVisiblePrice(true, false, "1200")).toBe(false);
    expect(getPricePresentation({ globalEnabled: true, productEnabled: false, priceInr: "1200" })).toBeNull();
    expect(hasVisiblePrice(true, true, "0")).toBe(false);
    expect(getPricePresentation({ globalEnabled: true, productEnabled: true, priceInr: "0" })).toBeNull();
    expect(getPricePresentation({ globalEnabled: true, productEnabled: true, priceInr: "1250", priceUnit: "vial" })).toEqual({ inr: "₹1,250 / vial" });
  });

  it("filters by category, dosage form, prescription and price range", () => {
    const filtered = filterAndSortCatalog(activeProducts, {
      category: "injectables", form: "Vial", rx: "yes", minPrice: 1000, maxPrice: 5000,
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((product) => product.category.slug === "injectables" && product.form === "Vial" && product.rx && Number(product.priceInr) >= 1000 && Number(product.priceInr) <= 5000)).toBe(true);
  });

  it("sorts by name, ascending and descending price, and newest", () => {
    expect(filterAndSortCatalog(activeProducts, { sort: "name" })[0].name).toBe("Medicine 01");
    expect(filterAndSortCatalog(activeProducts, { sort: "price-asc" })[0].name).toBe("Medicine 02");
    expect(filterAndSortCatalog(activeProducts, { sort: "price-desc" })[0].name).toBe("Medicine 53");
    expect(filterAndSortCatalog(activeProducts, { sort: "newest" })[0].name).toBe("Medicine 53");
  });
});
