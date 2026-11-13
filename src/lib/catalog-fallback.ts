import productsJson from "../../data/products.json";
import { isBlocked } from "@/lib/blocked";

type SourceProduct = {
  id: string; name: string; description: string; images?: string[];
  status: "active" | "review"; statusNote?: string; rx?: boolean;
  strength?: string; packSize?: string; composition?: string; form?: string;
  sourceRow?: number; price?: { amount?: number; unit?: string; display?: boolean };
};
type SourceCategory = { category: string; slug: string; products: SourceProduct[] };
export type StaticProduct = {
  id: string; name: string; slug: string; generic: string | null; strength: string | null;
  packSize: string | null; description: string; rx: boolean;
  patentRestricted: boolean; published: true; status: "active"; categoryId: string;
  createdAt: Date; images: string[]; imageUrl: string | null; category: { id: string; name: string; slug: string };
  priceInr: string | null; priceUnit: string | null; showPrice: boolean; form: string | null;
};
export type StaticCategory = { id: number; name: string; slug: string; sortOrder: number; imageUrl: null; description: null; _count: { products: number } };
const groups = productsJson as SourceCategory[];
const safeActive = (group: SourceCategory) => group.products.filter((product) =>
  product.status === "active" && !isBlocked(`${product.name} ${product.composition ?? ""} ${product.description} ${group.category}`),
);
export function getStaticCategories(): StaticCategory[] {
  return groups.map((group, sortOrder) => ({
    id: sortOrder, name: group.category, slug: group.slug, sortOrder, imageUrl: null, description: null,
    _count: { products: safeActive(group).length },
  })).filter((category) => category._count.products > 0);
}
export function getStaticProducts(): StaticProduct[] {
  return groups.flatMap((group) => safeActive(group).map((product) => ({
    id: product.id, name: product.name, slug: product.id,
    generic: product.composition ?? null, strength: product.strength ?? null,
    packSize: product.packSize ?? null, description: product.description,
    images: product.images ?? [], imageUrl: product.images?.[0] ?? null, rx: product.rx ?? true,
    patentRestricted: false, published: true as const, status: "active" as const,
    categoryId: group.slug, createdAt: new Date(0),
    category: { id: group.slug, name: group.category, slug: group.slug },
    priceInr: product.price?.amount && product.price.amount > 0 ? String(product.price.amount) : null,
    priceUnit: product.price?.unit ?? null,
    showPrice: Boolean(product.price?.amount && product.price.amount > 0),
    form: product.form ?? null,
  })));
}
export function findStaticProduct(slug: string): StaticProduct | null {
  return getStaticProducts().find((product) => product.slug === slug) ?? null;
}
