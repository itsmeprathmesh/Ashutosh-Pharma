import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const getHomeData = unstable_cache(
  async () => {
    const publicProduct = {
      where: { published: true, status: "active" as const },
      select: {
        id: true, name: true, slug: true, generic: true, description: true,
        images: true, imageUrl: true, strength: true, packSize: true, rx: true,
        createdAt: true, featuredRank: true, priceInr: true, priceUnit: true,
        showPrice: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    };
    const [featured, arrivals, categories, offers, reviews, posts, settings] = await Promise.all([
      db.product.findMany({ ...publicProduct, orderBy: [{ featuredRank: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }], take: 10 }),
      db.product.findMany({ ...publicProduct, orderBy: { createdAt: "desc" }, take: 8 }),
      db.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true, imageUrl: true, _count: { select: { products: { where: { published: true, status: "active" } } } } },
      }),
      db.offer.findMany({ where: { active: true, OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] }, orderBy: { createdAt: "desc" }, take: 3 }),
      db.review.findMany({ where: { approved: true }, orderBy: { reviewDate: "desc" }, take: 6 }),
      db.blogPost.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 3 }),
      db.setting.findUnique({ where: { id: 1 }, select: { showPrices: true } }),
    ]);
    const plainProducts = (products: typeof featured) => products.map((product) => ({ ...product, priceInr: product.priceInr?.toString() ?? null }));
    return [plainProducts(featured), plainProducts(arrivals), categories, offers, reviews, posts, settings?.showPrices ?? true] as const;
  },
  ["home-public-data"],
  { revalidate: 60, tags: ["public-catalog", "public-blog"] },
);

export const getPublicCategories = unstable_cache(
  async () => db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, imageUrl: true, _count: { select: { products: { where: { published: true, status: "active" } } } } },
  }),
  ["public-categories"],
  { revalidate: 300, tags: ["public-catalog"] },
);

export const getPublicCategory = unstable_cache(
  async (slug: string) => db.category.findFirst({ where: { slug, products: { some: { published: true, status: "active" } } } }),
  ["public-category"],
  { revalidate: 60, tags: ["public-catalog"] },
);

export const getPublicPriceSetting = unstable_cache(
  async () => (await db.setting.findUnique({ where: { id: 1 }, select: { showPrices: true } }))?.showPrices ?? true,
  ["public-price-setting"],
  { revalidate: 60, tags: ["public-catalog"] },
);

export const getCatalogProducts = unstable_cache(
  async (categorySlug?: string) => {
    const products = await db.product.findMany({
      where: { published: true, status: "active", ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
      select: {
        id: true, name: true, slug: true, generic: true, strength: true, packSize: true, form: true, description: true,
        published: true, status: true,
        images: true, imageUrl: true, rx: true, createdAt: true, priceInr: true, priceUnit: true, showPrice: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { name: "asc" },
    });
    return products.map((product) => ({ ...product, priceInr: product.priceInr?.toString() ?? null }));
  },
  ["catalog-products"],
  { revalidate: 60, tags: ["public-catalog"] },
);

export const getPublicCategoriesWithCounts = unstable_cache(
  async () => db.category.findMany({
    where: { products: { some: { published: true, status: "active" } } },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, imageUrl: true, description: true, _count: { select: { products: { where: { published: true, status: "active" } } } } },
  }),
  ["catalog-categories-with-counts"],
  { revalidate: 60, tags: ["public-catalog"] },
);

export const getPublicCategoryProducts = unstable_cache(
  async (categoryId: number) => db.product.findMany({ where: { categoryId, published: true, status: "active" }, select: { id: true, name: true, slug: true, generic: true, description: true, images: true, imageUrl: true, strength: true, packSize: true, form: true, rx: true, createdAt: true, priceInr: true, priceUnit: true, showPrice: true, category: { select: { name: true, slug: true } } }, orderBy: { name: "asc" } }).then((products) => products.map((product) => ({ ...product, priceInr: product.priceInr?.toString() ?? null }))),
  ["public-category-products"],
  { revalidate: 60, tags: ["public-catalog"] },
);

export const getPublicCategoryProductCount = unstable_cache(
  async (categoryId: number) => db.product.count({ where: { categoryId, published: true, status: "active" } }),
  ["public-category-product-count"],
  { revalidate: 60, tags: ["public-catalog"] },
);

export const getPublicProduct = unstable_cache(
  async (slug: string) => db.product.findFirst({
    where: { slug, published: true, status: "active" },
    select: { id: true, name: true, slug: true, generic: true, strength: true, packSize: true, form: true, description: true, images: true, imageUrl: true, rx: true, patentRestricted: true, published: true, status: true, priceInr: true, priceUnit: true, showPrice: true, categoryId: true, category: { select: { id: true, name: true, slug: true } } },
  }),
  ["public-product"],
  { revalidate: 60, tags: ["public-catalog"] },
);

export const getRelatedProducts = unstable_cache(
  async (categoryId: number, excludeId: number) => db.product.findMany({
    where: { categoryId, id: { not: excludeId }, published: true, status: "active" },
    select: { id: true, name: true, slug: true, generic: true, strength: true, packSize: true, form: true, description: true, images: true, imageUrl: true, rx: true, priceInr: true, priceUnit: true, showPrice: true, category: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" }, take: 12,
  }).then((products) => products.map((product) => ({ ...product, priceInr: product.priceInr?.toString() ?? null }))),
  ["public-related-products"],
  { revalidate: 60, tags: ["public-catalog"] },
);

export const getPublicBlogPosts = unstable_cache(
  async () => db.blogPost.findMany({ where: { published: true }, orderBy: { createdAt: "desc" } }),
  ["public-blog-posts"],
  { revalidate: 60, tags: ["public-blog"] },
);

export const getPublicBlogPost = unstable_cache(
  async (slug: string) => db.blogPost.findUnique({ where: { slug } }),
  ["public-blog-post"],
  { revalidate: 60, tags: ["public-blog"] },
);
