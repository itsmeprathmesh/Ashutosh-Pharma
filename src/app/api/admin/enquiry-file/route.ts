import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const params = new URL(request.url).searchParams;
  const parsedInput = z.object({ url: z.string().url().max(2048) }).strict().safeParse({ url: params.get("url") });
  if (!parsedInput.success || params.getAll("url").length !== 1) return NextResponse.json({ error: "Invalid document." }, { status: 400 });
  let parsed: URL;
  try { parsed = new URL(parsedInput.data.url); } catch { return NextResponse.json({ error: "Invalid document." }, { status: 400 }); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port || !parsed.hostname.endsWith(".private.blob.vercel-storage.com") || parsed.search || parsed.hash || !/^\/enquiry-documents\/[a-zA-Z0-9._-]+\.(pdf|jpe?g|png)$/i.test(parsed.pathname)) return NextResponse.json({ error: "Invalid document." }, { status: 400 });
  let blob;
  try { blob = await get(parsed.pathname.slice(1), { access: "private", token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN }); } catch { return NextResponse.json({ error: "Document unavailable." }, { status: 404 }); }
  if (!blob || blob.statusCode !== 200) return NextResponse.json({ error: "Document unavailable." }, { status: 404 });
  return new NextResponse(blob.stream, { headers: { "Content-Type": blob.blob.contentType, "Content-Disposition": `attachment; filename="${parsed.pathname.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") ?? "trade-document"}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
