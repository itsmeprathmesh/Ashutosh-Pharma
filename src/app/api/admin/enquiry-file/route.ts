import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!await isAdminAuthorized(request.headers.get("cookie"))) return new NextResponse("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return new NextResponse("Missing document", { status: 400 });
  let parsed: URL;
  try { parsed = new URL(url); } catch { return new NextResponse("Invalid document", { status: 400 }); }
  if (!parsed.hostname.endsWith(".private.blob.vercel-storage.com") || !parsed.pathname.startsWith("/enquiry-documents/")) return new NextResponse("Invalid document", { status: 400 });
  const blob = await get(parsed.pathname.slice(1), { access: "private", token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN });
  if (!blob || blob.statusCode !== 200) return new NextResponse("Document not found", { status: 404 });
  return new NextResponse(blob.stream, { headers: { "Content-Type": blob.blob.contentType, "Content-Disposition": `attachment; filename="${parsed.pathname.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") ?? "trade-document"}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
