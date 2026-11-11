"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import slugify from "slugify";
import { db } from "@/lib/db";
import { isBlocked } from "@/lib/blocked";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

function invalidatePublicData() {
  revalidateTag("public-catalog", "max");
  revalidateTag("public-blog", "max");
  revalidatePath("/");
  revalidatePath("/shop");
}

const productSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2).max(200),
  category: z.string().trim().min(2).max(100),
  generic: z.string().trim().max(200).optional().default(""),
  strength: z.string().trim().max(100).optional().default(""),
  packSize: z.string().trim().max(120).optional().default(""),
  description: z.string().trim().min(5).max(5000),
  imageUrl: z.string().trim().max(2048).refine((value) => {
    if (!value || /^\/products\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value)) return true;
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  }).optional().default(""),
  rx: z.boolean(),
  patentRestricted: z.boolean(),
  published: z.boolean(),
  featuredRank: z.number().int().positive().optional(),
  priceInr: z.number().finite().nonnegative().max(9999999999.99).optional(),
  priceUnit: z.string().trim().max(80).optional().default(""),
  showPrice: z.boolean(),
});

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function saveProduct(formData: FormData) {
  await requireAdmin(true);
  const parsed = productSchema.safeParse({
    id: text(formData, "id") || undefined,
    name: text(formData, "name"),
    category: text(formData, "category"),
    generic: text(formData, "generic"),
    strength: text(formData, "strength"),
    packSize: text(formData, "packSize"),
    description: text(formData, "description"),
    imageUrl: text(formData, "imageUrl"),
    rx: checked(formData, "rx"),
    patentRestricted: checked(formData, "patentRestricted"),
    published: checked(formData, "published"),
    featuredRank: text(formData, "featuredRank") ? Number(text(formData, "featuredRank")) : undefined,
    priceInr: text(formData, "priceInr") ? Number(text(formData, "priceInr")) : undefined,
    priceUnit: text(formData, "priceUnit"),
    showPrice: checked(formData, "showPrice"),
  });
  if (!parsed.success) redirect("/admin/products?error=invalid");

  const item = parsed.data;
  if (isBlocked(`${item.name} ${item.generic} ${item.description}`)) {
    redirect("/admin/products?error=blocked");
  }

  const categorySlug = slugify(item.category, { lower: true, strict: true });
  const category = await db.category.upsert({
    where: { slug: categorySlug },
    update: {},
    create: { name: item.category, slug: categorySlug },
  });
  const data = {
    name: item.name,
    slug: slugify(item.name, { lower: true, strict: true }),
    generic: item.generic || null,
    strength: item.strength || null,
    packSize: item.packSize || null,
    description: item.description,
    imageUrl: item.imageUrl || null,
    rx: item.rx,
    patentRestricted: item.patentRestricted,
    published: item.published,
    featuredRank: item.featuredRank ?? null,
    priceInr: item.priceInr ?? null,
    priceUnit: item.priceUnit || null,
    showPrice: item.showPrice,
    categoryId: category.id,
  };

  if (item.id) {
    const current = await db.product.findUnique({ where: { id: item.id }, select: { status: true } });
    if (current?.status === "review" && item.published) redirect("/admin/products?error=review");
    await db.product.update({ where: { id: item.id }, data });
  } else await db.product.create({ data });
  invalidatePublicData();
  redirect("/admin/products?saved=1");
}

export async function saveCatalogSettings(formData: FormData) {
  await requireAdmin(true);
  const showPrices = checked(formData, "showPrices");
  await db.setting.upsert({ where: { id: 1 }, create: { id: 1, showPrices }, update: { showPrices } });
  invalidatePublicData();
  redirect("/admin/products?settings=saved");
}

export async function hideAllPrices() {
  await requireAdmin(true);
  await db.product.updateMany({ data: { showPrice: false } });
  invalidatePublicData();
  redirect("/admin/products?prices=hidden");
}

export async function saveCategoryDescription(formData: FormData) {
  await requireAdmin(true);
  const parsed = z.object({ id: z.coerce.number().int().positive(), description: z.string().trim().max(1200) }).safeParse({ id: text(formData, "categoryId"), description: text(formData, "description") });
  if (!parsed.success) redirect("/admin/products?error=invalid");
  await db.category.update({ where: { id: parsed.data.id }, data: { description: parsed.data.description } });
  invalidatePublicData();
  redirect("/admin/products?category=saved");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin(true);
  const id = Number(text(formData, "id"));
  if (!Number.isInteger(id) || id < 1) redirect("/admin/products?error=invalid");
  await db.product.delete({ where: { id } });
  invalidatePublicData();
  redirect("/admin/products?deleted=1");
}

export async function attachUploadedImage(filename: string, imageUrl: string) {
  await requireAdmin(true);
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return { matched: false, error: "Invalid image URL." };
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port || !url.hostname.endsWith(".public.blob.vercel-storage.com")) {
    return { matched: false, error: "Only approved public Blob image URLs can be attached." };
  }
  const baseName = filename.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") ?? "";
  const slug = slugify(baseName, { lower: true, strict: true });
  if (!slug) return { matched: false, error: "The filename does not match a product slug." };
  const product = await db.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return { matched: false, error: "No product matches this filename." };
  await db.product.update({ where: { id: product.id }, data: { imageUrl } });
  invalidatePublicData();
  return { matched: true };
}

export async function setCategoryImage(categoryId: number, imageUrl: string) {
  await requireAdmin(true);
  if (!Number.isInteger(categoryId) || categoryId < 1) return { ok: false, error: "Invalid category." };
  let url: URL;
  try { url = new URL(imageUrl); } catch { return { ok: false, error: "Invalid image URL." }; }
  if (url.protocol !== "https:" || url.username || url.password || url.port || !url.hostname.endsWith(".public.blob.vercel-storage.com")) {
    return { ok: false, error: "Only approved public Blob images can be used." };
  }
  await db.category.update({ where: { id: categoryId }, data: { imageUrl: url.href } });
  revalidateTag("public-catalog", "max");
  revalidatePath("/");
  return { ok: true };
}

export async function updateEnquiryStatus(formData: FormData) {
  await requireAdmin(true);
  const id = Number(text(formData, "id"));
  const status = text(formData, "status");
  if (!Number.isInteger(id) || id < 1 || !["new", "contacted", "closed"].includes(status)) {
    redirect("/admin/enquiries?error=invalid");
  }
  await db.enquiry.update({ where: { id }, data: { status } });
  redirect("/admin/enquiries?saved=1");
}

async function reviewProduct(formData: FormData, approve: boolean) {
  const actor = await requireAdmin(true);
  if (!actor) redirect("/admin/login");
  const id = Number(text(formData, "id"));
  if (!Number.isInteger(id) || id < 1) redirect("/admin/products?error=invalid");
  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: approve ? { status: "active", published: true, statusNote: null } : { status: "review", published: false } });
    await tx.productAudit.create({ data: { productId: id, action: approve ? "approved" : "kept_hidden", actor } });
  });
  revalidatePath("/shop");
  revalidatePath("/");
  revalidateTag("public-catalog", "max");
  redirect(`/admin/products?view=review&${approve ? "approved=1" : "hidden=1"}`);
}

export async function approveReviewProduct(formData: FormData) { await requireAdmin(true); await reviewProduct(formData, true); }
export async function keepReviewProductHidden(formData: FormData) { await requireAdmin(true); await reviewProduct(formData, false); }
