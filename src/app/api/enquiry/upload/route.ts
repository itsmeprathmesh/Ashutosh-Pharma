import { del, get } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readBoundedBytes } from "@/lib/request-body";
import { matchesFileExtension, sniffUploadType } from "@/lib/file-signatures";
import { publicRateLimit } from "@/lib/public-rate-limit";

const bodySchema = z.union([
  z.object({ type: z.literal("blob.generate-client-token"), payload: z.object({ pathname: z.string().min(1).max(300), clientPayload: z.string().max(2000).nullable(), multipart: z.boolean() }).passthrough() }).passthrough(),
  z.object({ type: z.literal("blob.upload-completed"), payload: z.object({ blob: z.object({ url: z.string().url().max(2048), pathname: z.string().max(300), contentType: z.string().max(200) }).passthrough(), tokenPayload: z.string().max(2000).nullable().optional() }).passthrough() }).passthrough(),
]);

export async function POST(request: Request) {
  if (!process.env.BLOB_PRIVATE_READ_WRITE_TOKEN) return NextResponse.json({ error: "Private document storage is not configured" }, { status: 503 });
  const bounded = await readBoundedBytes(request, 64 * 1024);
  if (!bounded.ok) return NextResponse.json({ error: "Invalid or oversized upload request." }, { status: bounded.status });
  const boundedRequest = new Request(request.url, { method: "POST", headers: request.headers, body: Buffer.from(bounded.bytes) });
  let decoded: unknown;
  try { decoded = JSON.parse(new TextDecoder().decode(bounded.bytes)); } catch { return NextResponse.json({ error: "Invalid upload request" }, { status: 400 }); }
  const parsed = bodySchema.safeParse(decoded);
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  const body = parsed.data as HandleUploadBody;
  if (body.type === "blob.generate-client-token") {
    try { if (!await publicRateLimit(request, "enquiry-upload", 10, 60 * 60_000)) return NextResponse.json({ error: "Too many upload requests. Please try later." }, { status: 429 }); }
    catch { return NextResponse.json({ error: "Upload service is temporarily unavailable." }, { status: 503 }); }
  }
  const origin = request.headers.get("origin"); const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let sameHost = false; try { sameHost = Boolean(origin && host && new URL(origin).host === host); } catch { /* invalid origin */ }
  if (!sameHost) return NextResponse.json({ error: "Cross-origin upload request blocked" }, { status: 403 });
  try {
    const response = await handleUpload({ body, request: boundedRequest, token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN, onBeforeGenerateToken: async (pathname) => {
      if (!/^enquiry-documents\/[a-zA-Z0-9._-]+\.(pdf|jpe?g|png)$/i.test(pathname)) throw new Error("Only PDF, JPG and PNG trade documents are accepted");
      return { allowedContentTypes: ["application/pdf", "image/jpeg", "image/png"], maximumSizeInBytes: 5 * 1024 * 1024, addRandomSuffix: true, validUntil: Date.now() + 10 * 60 * 1000 };
    }, onUploadCompleted: async ({ blob }) => {
      const uploaded = await get(blob.pathname, { access: "private", token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN });
      if (!uploaded || uploaded.statusCode !== 200 || typeof uploaded.blob.size !== "number" || uploaded.blob.size > 5 * 1024 * 1024) { await del(blob.pathname, { token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN }); return; }
      const bounded = await readBoundedBytes(new Response(uploaded.stream), 5 * 1024 * 1024);
      if (!bounded.ok) { await del(blob.pathname, { token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN }); return; }
      const bytes = bounded.bytes;
      const type = sniffUploadType(bytes);
      if (!type || !matchesFileExtension(blob.pathname, type) || !["application/pdf", "image/jpeg", "image/png"].includes(type)) await del(blob.pathname, { token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN });
    }});
    return NextResponse.json(response);
  } catch { return NextResponse.json({ error: "Upload could not be authorized" }, { status: 400 }); }
}
