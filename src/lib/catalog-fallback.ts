import productsJson from "../../data/products.json";
import { isBlocked } from "@/lib/blocked";

type SourceProduct = {
  id: string; name: string; description: string; images?: string[];
  status: "active" | "review"; statusNote?: string; rx?: boolean;
  strength?: string; packSize?: string; composition?: string; form?: string;
  sourceRow?: number; price?: { amount?: number; unit?: string };
};
type SourceCategory = { category: string; slug: string; products: SourceProduct[] };
export type StaticProduct = {
  id: string; name: string; slug: string; generic: string | null; strength: string | null;
  packSize: string | null; description: string; imageUrl: string | null; rx: boolean;
  patentRestricted: boolean; published: true; status: "active"; categoryId: string;
  createdAt: Date; category: { id: string; name: string; slug: string };
};
export type StaticCategory = { id: string; name: string; slug: string; sortOrder: number; _count: { products: number } };
const groups = productsJson as SourceCategory[];
const safeActive = (group: SourceCategory) => group.products.filter((product) =>
  product.status === "active" && !isBlocked(`${product.name} ${product.composition ?? ""} ${product.description} ${group.category}`),
);
export function getStaticCategories(): StaticCategory[] {
  return groups.map((group, sortOrder) => ({
    id: group.slug, name: group.category, slug: group.slug, sortOrder,
    _count: { products: safeActive(group).length },
  })).filter((category) => category._count.products > 0);
}
export function getStaticProducts(): StaticProduct[] {
  return groups.flatMap((group) => safeActive(group).map((product) => ({
    id: product.id, name: product.name, slug: product.id,
    generic: product.composition ?? null, strength: product.strength ?? null,
    packSize: product.packSize ?? null, description: product.description,
    imageUrl: product.images?.[0] ?? null, rx: product.rx ?? true,
    patentRestricted: false, published: true as const, status: "active" as const,
    categoryId: group.slug, createdAt: new Date(0),
    category: { id: group.slug, name: group.category, slug: group.slug },
  })));
}
export function findStaticProduct(slug: string): StaticProduct | null {
  return getStaticProducts().find((product) => product.slug === slug) ?? null;
}
