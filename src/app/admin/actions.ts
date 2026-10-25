"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import slugify from "slugify";
import { db } from "@/lib/db";
import { isBlocked } from "@/lib/blocked";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { revalidatePath, revalidateTag } from "next/cache";

function invalidatePublicData() {
  revalidateTag("public-catalog");
  revalidateTag("public-blog");
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
});

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function saveProduct(formData: FormData) {
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

export async function deleteProduct(formData: FormData) {
  const id = Number(text(formData, "id"));
  if (!Number.isInteger(id) || id < 1) redirect("/admin/products?error=invalid");
  await db.product.delete({ where: { id } });
  invalidatePublicData();
  redirect("/admin/products?deleted=1");
}

export async function attachUploadedImage(filename: string, imageUrl: string) {
  if (!await isAdminAuthorized((await headers()).get("cookie"))) {
    return { matched: false, error: "Authentication required." };
  }
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return { matched: false, error: "Invalid image URL." };
  }
  if (url.protocol !== "https:" || !url.hostname.endsWith(".public.blob.vercel-storage.com")) {
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

export async function updateEnquiryStatus(formData: FormData) {
  const id = Number(text(formData, "id"));
  const status = text(formData, "status");
  if (!Number.isInteger(id) || id < 1 || !["new", "contacted", "closed"].includes(status)) {
    redirect("/admin/enquiries?error=invalid");
  }
  await db.enquiry.update({ where: { id }, data: { status } });
  redirect("/admin/enquiries?saved=1");
}

async function reviewProduct(formData: FormData, approve: boolean) {
  const id = Number(text(formData, "id"));
  if (!Number.isInteger(id) || id < 1 || !await isAdminAuthorized((await headers()).get("cookie"))) redirect("/admin/products?error=invalid");
  const actor = process.env.ADMIN_USER || "admin";
  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: approve ? { status: "active", published: true, statusNote: null } : { status: "review", published: false } });
    await tx.productAudit.create({ data: { productId: id, action: approve ? "approved" : "kept_hidden", actor: actor || "admin" } });
  });
  revalidatePath("/shop");
  revalidatePath("/");
  revalidateTag("public-catalog");
  redirect(`/admin/products?view=review&${approve ? "approved=1" : "hidden=1"}`);
}

export async function approveReviewProduct(formData: FormData) { await reviewProduct(formData, true); }
export async function keepReviewProductHidden(formData: FormData) { await reviewProduct(formData, false); }
