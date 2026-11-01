import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { db } from "@/lib/db";
import { isBlocked } from "@/lib/blocked";
import { readJsonBody } from "@/lib/request-body";
import { createHmac } from "node:crypto";
import { publicRateLimit } from "@/lib/public-rate-limit";

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).optional().default(""),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(50).optional().default(""),
  country: z.string().trim().max(100).optional().default("Not provided"),
  product: z.string().trim().max(200).optional().default(""),
  productSlug: z.string().trim().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().default(""),
  quantity: z.string().trim().max(120).optional().default(""),
  licenceNo: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().max(3000).optional().default(""),
  website: z.string().max(0).optional().default(""),
  general: z.boolean().optional().default(false),
  items: z.array(z.object({ product: z.string().trim().min(1).max(200), quantity: z.string().trim().min(1).max(120) })).max(50).optional().default([]),
  files: z.array(z.string().url().max(1200)).max(5).optional().default([]),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try { if (!origin || new URL(origin).origin !== new URL(request.url).origin) return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 }); } catch { return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 }); }
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Enquiry service is not configured yet. Please contact us on WhatsApp." }, { status: 503 });
  const body = await readJsonBody(request, 32 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.status === 413 ? "Enquiry request is too large" : "Invalid JSON body" }, { status: body.status });

  const parsed = enquirySchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: "Invalid enquiry details" }, { status: 400 });
  const { website, productSlug, items, files, general, ...data } = parsed.data;
  if (website) return NextResponse.json({ ok: true });

  const safeText = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  const headerText = (value: string) => safeText(value).replace(/[\r\n]+/g, " ").slice(0, 180);
  const cleanData = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, typeof value === "string" ? safeText(value) : value])) as typeof data;
  const cleanItems = items.map((item) => ({ product: safeText(item.product), quantity: safeText(item.quantity) }));
  const cleanFiles = files.map((file) => {
    try { const parsedUrl = new URL(file); return parsedUrl.protocol === "https:" && !parsedUrl.username && !parsedUrl.password && !parsedUrl.port && parsedUrl.hostname.endsWith(".private.blob.vercel-storage.com") && !parsedUrl.search && !parsedUrl.hash && /^\/enquiry-documents\/[a-zA-Z0-9._-]+\.(pdf|jpe?g|png)$/i.test(parsedUrl.pathname) ? parsedUrl.href : ""; } catch { return ""; }
  });
  if (cleanFiles.some((file) => !file)) return NextResponse.json({ error: "Invalid enquiry details" }, { status: 400 });

  if (!cleanData.name || !cleanData.email || (!cleanItems.length && !cleanData.product) || isBlocked(cleanData.product) || (cleanItems.length > 0 && cleanItems.some((item) => isBlocked(item.product)))) {
    return NextResponse.json({ error: "Please provide valid trade enquiry details" }, { status: 400 });
  }

  const requestIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const rateLimitSecret = process.env.SESSION_SECRET;
  if (!rateLimitSecret || rateLimitSecret.length < 32) return NextResponse.json({ error: "Enquiry service is temporarily unavailable" }, { status: 503 });
  const ip = createHmac("sha256", rateLimitSecret).update(requestIp).digest("hex");
  try {
    if (!await publicRateLimit(request, "enquiry", 5, 60 * 60_000)) return NextResponse.json({ error: "Too many enquiries. Please try again later." }, { status: 429 });
  } catch {
    return NextResponse.json({ error: "Enquiry service is temporarily unavailable" }, { status: 503 });
  }

  let catalogueItems: { product: string; quantity: string; record: { name: string; rx: boolean } | null }[];
  let product: { id: number; name: string; rx: boolean; published: boolean; status: string; generic: string | null; description: string } | null;
  try {
    const requestedNames = [...new Set(cleanItems.map((item) => item.product))];
    const productRecords = requestedNames.length ? await db.product.findMany({ where: { name: { in: requestedNames }, published: true, status: "active" }, select: { name: true, rx: true } }) : [];
    const productsByName = new Map(productRecords.map((record) => [record.name, record]));
    catalogueItems = cleanItems.map((item) => ({ ...item, record: productsByName.get(item.product) ?? null }));
    product = productSlug
      ? await db.product.findUnique({ where: { slug: productSlug }, select: { id: true, name: true, rx: true, published: true, status: true, generic: true, description: true } })
      : null;
  } catch {
    return NextResponse.json({ error: "Enquiry service is temporarily unavailable" }, { status: 503 });
  }
  if (catalogueItems.some(({ record }) => !record)) return NextResponse.json({ error: "One or more products are unavailable" }, { status: 400 });

  if (productSlug && (!product || !product.published || product.status !== "active" || product.name !== cleanData.product || isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`))) {
    return NextResponse.json({ error: "Product is unavailable" }, { status: 400 });
  }
  const requiresLicence = cleanItems.length > 0
    ? catalogueItems.some(({ record }) => record?.rx)
    : productSlug ? (product?.rx ?? true) : false;
  if (requiresLicence && !cleanData.licenceNo) {
    return NextResponse.json({ error: "An importer licence number is required for prescription products" }, { status: 400 });
  }

  const productSummary = cleanItems.length ? cleanItems.map((item) => `${item.product} (${item.quantity})`).join(", ").slice(0, 200) : cleanData.product;
  const quantitySummary = cleanItems.length ? `${cleanItems.length} products` : cleanData.quantity;
  let enquiry: { id: number };
  try {
    const created = await db.enquiry.create({ data: {
        ...cleanData, product: productSummary || (general ? "General trade enquiry" : "General trade enquiry"), quantity: quantitySummary || "Not provided",
        ...(productSlug && product ? { productId: product.id } : {}),
        message: [cleanData.message, cleanFiles.length ? `Documents: ${cleanFiles.join(", ")}` : ""].filter(Boolean).join("\n").slice(0, 3000),
        ip,
        ...(cleanItems.length ? { items: { create: cleanItems } } : {}),
    } });
    enquiry = created;
  } catch {
    return NextResponse.json({ error: "Unable to save this enquiry right now" }, { status: 503 });
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM && process.env.OWNER_EMAIL) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const lines = [...Object.entries(cleanData).map(([key, value]) => `${key}: ${typeof value === "string" ? safeText(value) : ""}`), ...cleanItems.map((item) => `Item: ${safeText(item.product)} | Quantity: ${safeText(item.quantity)}`), ...cleanFiles.map((file) => `Document: ${file}`)].join("\n");
      await resend.emails.send({
        from: process.env.RESEND_FROM,
        to: process.env.OWNER_EMAIL,
        subject: `New trade enquiry: ${headerText(cleanData.product)} (${headerText(cleanData.country)})`,
        text: lines,
      }, { signal: AbortSignal.timeout(8_000) });
    } catch (error) {
      console.error(JSON.stringify({ level: "error", event: "enquiry_email_delivery_failed", errorName: error instanceof Error ? error.name : "unknown" }));
    }
  }

  return NextResponse.json({ ok: true, id: enquiry.id });
}
