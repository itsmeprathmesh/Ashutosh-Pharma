import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const getHomeData = unstable_cache(
  async () => Promise.all([
    db.product.findMany({ where: { published: true, status: "active" }, include: { category: true }, orderBy: { name: "asc" }, take: 8 }),
    db.product.findMany({ where: { published: true, status: "active" }, include: { category: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { published: true, status: "active" } } } } } }),
    db.blogPost.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]),
  ["home-public-data"],
  { revalidate: 60, tags: ["public-catalog", "public-blog"] },
);

export const getPublicCategories = unstable_cache(
  async () => db.category.findMany({ where: { products: { some: { published: true, status: "active" } } }, orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
  ["public-categories"],
  { revalidate: 300, tags: ["public-catalog"] },
);

export const getPublicCategory = unstable_cache(
  async (slug: string) => db.category.findUnique({ where: { slug } }),
  ["public-category"],
  { revalidate: 60, tags: ["public-catalog"] },
);

export const getPublicCategoryProducts = unstable_cache(
  async (categoryId: number, skip: number) => db.product.findMany({ where: { categoryId, published: true, status: "active" }, select: { id: true, name: true, slug: true, generic: true, description: true, imageUrl: true, packSize: true, rx: true }, orderBy: { name: "asc" }, skip, take: 24 }),
  ["public-category-products"],
  { revalidate: 60, tags: ["public-catalog"] },
);

export const getPublicCategoryProductCount = unstable_cache(
  async (categoryId: number) => db.product.count({ where: { categoryId, published: true, status: "active" } }),
  ["public-category-product-count"],
  { revalidate: 60, tags: ["public-catalog"] },
);

export const getPublicProduct = unstable_cache(
  async (slug: string) => db.product.findUnique({ where: { slug }, include: { category: true } }),
  ["public-product"],
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
