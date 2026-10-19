import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import slugify from "slugify";
import { db } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function POST(request: Request) {
  let body: HandleUploadBody;
  try {
    body = await request.json() as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }
  const action = (body as { type?: string }).type;
  if (action === "blob.generate-client-token") {
    if (!isAdminAuthorized(request.headers.get("authorization"))) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    let sameHost = false;
    try { sameHost = Boolean(origin && host && new URL(origin).host === host); } catch { /* invalid origin */ }
    if (!sameHost) {
      return NextResponse.json({ error: "Cross-origin upload request blocked." }, { status: 403 });
    }
  }
  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/\.(jpe?g|png|webp)$/i.test(pathname)) {
          throw new Error("Only JPEG, PNG, and WebP product images are allowed.");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ originalName: pathname }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload ?? "{}") as { originalName?: string };
        const name = payload.originalName?.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") ?? "";
        const slug = slugify(name, { lower: true, strict: true });
        if (!slug) return;
        const product = await db.product.findUnique({ where: { slug }, select: { id: true } });
        if (product) await db.product.update({ where: { id: product.id }, data: { imageUrl: blob.url } });
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload could not be authorized.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
