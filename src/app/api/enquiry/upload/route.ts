import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.BLOB_PRIVATE_READ_WRITE_TOKEN) return NextResponse.json({ error: "Private document storage is not configured" }, { status: 503 });
  let body: HandleUploadBody;
  try { body = await request.json() as HandleUploadBody; } catch { return NextResponse.json({ error: "Invalid upload request" }, { status: 400 }); }
  const origin = request.headers.get("origin"); const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let sameHost = false; try { sameHost = Boolean(origin && host && new URL(origin).host === host); } catch { /* invalid origin */ }
  if (!sameHost) return NextResponse.json({ error: "Cross-origin upload request blocked" }, { status: 403 });
  try {
    const response = await handleUpload({ body, request, token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN, onBeforeGenerateToken: async (pathname) => {
      if (!/^enquiry-documents\/[a-zA-Z0-9._-]+\.(pdf|jpe?g|png)$/i.test(pathname)) throw new Error("Only PDF, JPG and PNG trade documents are accepted");
      return { allowedContentTypes: ["application/pdf", "image/jpeg", "image/png"], maximumSizeInBytes: 5 * 1024 * 1024, addRandomSuffix: true, validUntil: Date.now() + 10 * 60 * 1000 };
    }});
    return NextResponse.json(response);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Upload could not be authorized" }, { status: 400 }); }
}
