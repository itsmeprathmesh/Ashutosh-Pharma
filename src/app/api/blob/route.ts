import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { db } from "@/lib/db";
import { requireAdmin, sameOrigin } from "@/lib/auth";
import { readBoundedBytes } from "@/lib/request-body";
import { matchesFileExtension, sniffUploadType } from "@/lib/file-signatures";

const bodySchema = z.union([
  z.object({ type: z.literal("blob.generate-client-token"), payload: z.object({ pathname: z.string().min(1).max(300), clientPayload: z.string().max(2000).nullable(), multipart: z.boolean() }).passthrough() }).passthrough(),
  z.object({ type: z.literal("blob.upload-completed"), payload: z.object({ blob: z.object({ url: z.string().url().max(2048), pathname: z.string().max(300), contentType: z.string().max(200) }).passthrough(), tokenPayload: z.string().max(2000).nullable().optional() }).passthrough() }).passthrough(),
]);

export async function POST(request: Request) {
  const bounded = await readBoundedBytes(request, 64 * 1024);
  if (!bounded.ok) return NextResponse.json({ error: "Invalid or oversized upload request." }, { status: bounded.status });
  const boundedRequest = new Request(request.url, { method: "POST", headers: request.headers, body: Buffer.from(bounded.bytes) });
  let decoded: unknown;
  try { decoded = JSON.parse(new TextDecoder().decode(bounded.bytes)); } catch { return NextResponse.json({ error: "Invalid upload request." }, { status: 400 }); }
  const parsed = bodySchema.safeParse(decoded);
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  const body = parsed.data as HandleUploadBody;
  const action = (body as { type?: string }).type;
  if (action === "blob.generate-client-token") {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!sameOrigin(request)) {
      return NextResponse.json({ error: "Cross-origin upload request blocked." }, { status: 403 });
    }
  }
  try {
    const response = await handleUpload({
      body,
      request: boundedRequest,
      onBeforeGenerateToken: async (pathname) => {
        if (!/\.(jpe?g|png|webp)$/i.test(pathname)) {
          throw new Error("Only JPEG, PNG, and WebP product images are allowed.");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
          tokenPayload: JSON.stringify({ originalName: pathname }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload ?? "{}") as { originalName?: string };
        const blobUrl = new URL(blob.url);
        const blobHostAllowed = blobUrl.protocol === "https:" && !blobUrl.username && !blobUrl.password && !blobUrl.port && blobUrl.hostname.endsWith(".public.blob.vercel-storage.com");
        if (!blobHostAllowed) { await del(blob.url); return; }
        const mediaResponse = await fetch(blob.url, { signal: AbortSignal.timeout(8_000), cache: "no-store", redirect: "error" });
        if (!mediaResponse.ok) { await del(blob.url); return; }
        const bounded = await readBoundedBytes(mediaResponse, 5 * 1024 * 1024);
        if (!bounded.ok) { await del(blob.url); return; }
        const bytes = bounded.bytes;
        const type = sniffUploadType(bytes);
        if (!type || !matchesFileExtension(payload.originalName ?? "", type) || !["image/jpeg", "image/png", "image/webp"].includes(type)) { await del(blob.url); return; }
        const name = payload.originalName?.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") ?? "";
        const slug = slugify(name, { lower: true, strict: true });
        if (!slug) return;
        const product = await db.product.findUnique({ where: { slug }, select: { id: true } });
        if (product) await db.product.update({ where: { id: product.id }, data: { imageUrl: blob.url } });
      },
    });
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Image upload could not be authorized." }, { status: 400 });
  }
}
