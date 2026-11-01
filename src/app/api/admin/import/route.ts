import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { fetchSheet, importRows, parseFile, type Row } from "@/lib/import";
import { requireAdmin, sameOrigin } from "@/lib/auth";
import { timingSafeStringEqual } from "@/lib/secret-compare";
import { readBoundedBytes } from "@/lib/request-body";
import { z } from "zod";

export const dynamic = "force-dynamic";
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 5000;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
  const bearer = request.headers.get("authorization") ?? "";
  const expectedToken = process.env.IMPORT_API_TOKEN ?? "";
  const machineAuthorized = Boolean(expectedToken && bearer.startsWith("Bearer ") && timingSafeStringEqual(bearer.slice(7), expectedToken));
  if (!machineAuthorized && !await requireAdmin()) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const url = new URL(request.url);
  const dryRunParam = url.searchParams.get("dryRun");
  if (url.searchParams.getAll("dryRun").length > 1 || (dryRunParam !== null && !["0", "1"].includes(dryRunParam))) return NextResponse.json({ error: "Invalid import options." }, { status: 400 });
  const bounded = await readBoundedBytes(request, MAX_FILE_BYTES);
  if (!bounded.ok) return NextResponse.json({ error: bounded.status === 413 ? "Import request is too large." : "Invalid import request." }, { status: bounded.status });
  const boundedRequest = new Request(request.url, { method: "POST", headers: request.headers, body: Buffer.from(bounded.bytes) });
  const dryRun = dryRunParam === "1";
  const rows: Row[] = [];
  try {
    if ((request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await boundedRequest.formData();
      const files = form.getAll("files");
      if (!files.length || files.some((item) => !(item instanceof File))) return NextResponse.json({ error: "Select supported catalogue files." }, { status: 400 });
      if (files.length > 20) return NextResponse.json({ error: "Upload up to 20 files at a time, within the 4 MB request limit." }, { status: 413 });
      const totalBytes = files.reduce((total, item) => total + (item instanceof File ? item.size : 0), 0);
      if (totalBytes > MAX_FILE_BYTES) return NextResponse.json({ error: "Keep the total import request under 4 MB." }, { status: 413 });
      for (const item of files) {
        if (!(item instanceof File)) continue;
        if (item.size > MAX_FILE_BYTES || item.name.length > 180 || item.name.includes("/") || item.name.includes("\\")) return NextResponse.json({ error: "A catalogue file is invalid or too large." }, { status: item.size > MAX_FILE_BYTES ? 413 : 400 });
        rows.push(...await parseFile(item.name, Buffer.from(await item.arrayBuffer())));
        if (rows.length > MAX_ROWS) return NextResponse.json({ error: `Import is limited to ${MAX_ROWS} rows at a time.` }, { status: 413 });
      }
    } else {
      const body = z.object({ sheetUrl: z.string().url().max(500) }).strict().safeParse(await boundedRequest.json());
      if (!body.success) return NextResponse.json({ error: "A valid Google Sheets URL is required." }, { status: 400 });
      rows.push(...await fetchSheet(body.data.sheetUrl));
    }
  } catch {
    return NextResponse.json({ error: "Could not read the catalogue import. Check its file format, content, and row limits." }, { status: 400 });
  }

  const safeRows = z.array(z.record(z.string().max(100), z.string().max(5000))).max(MAX_ROWS).safeParse(rows);
  if (!safeRows.success) return NextResponse.json({ error: "Catalogue rows exceed allowed field or row limits." }, { status: 400 });
  let result;
  try { result = await importRows(safeRows.data, dryRun); }
  catch { return NextResponse.json({ error: "The catalogue import could not be saved." }, { status: 503 }); }
  if (!dryRun) {
    revalidateTag("public-catalog", "max");
    revalidatePath("/", "layout");
  }
  return NextResponse.json(result);
}
