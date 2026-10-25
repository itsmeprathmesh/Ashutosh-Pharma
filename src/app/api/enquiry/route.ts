import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { db } from "@/lib/db";
import { isBlocked } from "@/lib/blocked";
import { readJsonBody } from "@/lib/request-body";

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).optional().default(""),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(50).optional().default(""),
  country: z.string().trim().max(100).optional().default("Not provided"),
  product: z.string().trim().max(200).optional().default(""),
  productSlug: z.string().trim().max(200).optional().default(""),
  quantity: z.string().trim().max(120).optional().default(""),
  licenceNo: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().max(3000).optional().default(""),
  website: z.string().max(0).optional().default(""),
  general: z.boolean().optional().default(false),
  items: z.array(z.object({ product: z.string().trim().min(1).max(200), quantity: z.string().trim().min(1).max(120) })).max(50).optional().default([]),
  files: z.array(z.string().url().max(1200)).max(5).optional().default([]),
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Enquiry service is not configured yet. Please contact us on WhatsApp." }, { status: 503 });
  const body = await readJsonBody(request, 32 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.status === 413 ? "Enquiry request is too large" : "Invalid JSON body" }, { status: body.status });

  const parsed = enquirySchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: "Invalid enquiry details" }, { status: 400 });
  const { website, productSlug, items, files, general, ...data } = parsed.data;
  void general;
  if (website) return NextResponse.json({ error: "Invalid enquiry details" }, { status: 400 });

  if (!data.name || !data.email || (!items.length && !data.product) || isBlocked(data.product) || (items.length > 0 && items.some((item) => isBlocked(item.product)))) {
    return NextResponse.json({ error: "Please provide valid trade enquiry details" }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const since = new Date(Date.now() - 60 * 60 * 1000);
  let recentCount: number;
  try {
    recentCount = await db.enquiry.count({ where: { ip, createdAt: { gte: since } } });
  } catch {
    return NextResponse.json({ error: "Enquiry service is temporarily unavailable" }, { status: 503 });
  }
  if (recentCount >= 5) return NextResponse.json({ error: "Too many enquiries. Please try again later." }, { status: 429 });

  let catalogueItems: { product: string; quantity: string; record: { name: string; rx: boolean } | null }[];
  let product: { id: number; name: string; rx: boolean; published: boolean; status: string; generic: string | null; description: string } | null;
  try {
    const requestedNames = [...new Set(items.map((item) => item.product))];
    const productRecords = requestedNames.length ? await db.product.findMany({ where: { name: { in: requestedNames }, published: true, status: "active" }, select: { name: true, rx: true } }) : [];
    const productsByName = new Map(productRecords.map((record) => [record.name, record]));
    catalogueItems = items.map((item) => ({ ...item, record: productsByName.get(item.product) ?? null }));
    product = productSlug
      ? await db.product.findUnique({ where: { slug: productSlug }, select: { id: true, name: true, rx: true, published: true, status: true, generic: true, description: true } })
      : null;
  } catch {
    return NextResponse.json({ error: "Enquiry service is temporarily unavailable" }, { status: 503 });
  }
  if (catalogueItems.some(({ record }) => !record)) return NextResponse.json({ error: "One or more products are unavailable" }, { status: 400 });

  if (productSlug && (!product || !product.published || product.status !== "active" || product.name !== data.product || isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`))) {
    return NextResponse.json({ error: "Product is unavailable" }, { status: 400 });
  }
  const requiresLicence = items.length > 0
    ? catalogueItems.some(({ record }) => record?.rx)
    : productSlug ? (product?.rx ?? true) : false;
  if (requiresLicence && !data.licenceNo) {
    return NextResponse.json({ error: "An importer licence number is required for prescription products" }, { status: 400 });
  }

  const productSummary = items.length ? items.map((item) => `${item.product} (${item.quantity})`).join(", ").slice(0, 200) : data.product;
  const quantitySummary = items.length ? `${items.length} products` : data.quantity;
  let enquiry: { id: number };
  try {
    enquiry = await db.enquiry.create({ data: {
      ...data, product: productSummary || "General trade enquiry", quantity: quantitySummary || "Not provided",
      ...(productSlug && product ? { productId: product.id } : {}),
      message: [data.message, files.length ? `Documents: ${files.join(", ")}` : ""].filter(Boolean).join("\n").slice(0, 3000),
      ip,
      ...(items.length ? { items: { create: items } } : {}),
    } });
  } catch {
    return NextResponse.json({ error: "Unable to save this enquiry right now" }, { status: 503 });
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM && process.env.OWNER_EMAIL) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const lines = [...Object.entries(data).map(([key, value]) => `${key}: ${value || ""}`), ...items.map((item) => `Item: ${item.product} | Quantity: ${item.quantity}`), ...files.map((file) => `Document: ${file}`)].join("\n");
      await resend.emails.send({
        from: process.env.RESEND_FROM,
        to: process.env.OWNER_EMAIL,
        subject: `New trade enquiry: ${data.product} (${data.country})`,
        text: lines,
      }, { signal: AbortSignal.timeout(8_000) });
    } catch (error) {
      console.error("Enquiry saved, but Resend email failed", error);
    }
  }

  return NextResponse.json({ ok: true, id: enquiry.id });
}
