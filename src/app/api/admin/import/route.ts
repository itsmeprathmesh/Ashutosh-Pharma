import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchSheet, importRows, parseFile, type Row } from "@/lib/import";

export const dynamic = "force-dynamic";
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 5000;

export async function POST(request: Request) {
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_FILE_BYTES) return NextResponse.json({ error: "Keep each import request under 4 MB." }, { status: 413 });
  const rows: Row[] = [];
  try {
    if ((request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await request.formData();
      const files = form.getAll("files");
      if (files.length > 20) return NextResponse.json({ error: "Upload up to 20 files at a time, within the 4 MB request limit." }, { status: 413 });
      const totalBytes = files.reduce((total, item) => total + (item instanceof File ? item.size : 0), 0);
      if (totalBytes > MAX_FILE_BYTES) return NextResponse.json({ error: "Keep the total import request under 4 MB." }, { status: 413 });
      for (const item of files) {
        if (!(item instanceof File)) continue;
        if (item.size > MAX_FILE_BYTES) return NextResponse.json({ error: `${item.name} exceeds the 4 MB limit.` }, { status: 413 });
        rows.push(...await parseFile(item.name, Buffer.from(await item.arrayBuffer())));
        if (rows.length > MAX_ROWS) return NextResponse.json({ error: `Import is limited to ${MAX_ROWS} rows at a time.` }, { status: 413 });
      }
    } else {
      const body = await request.json() as { sheetUrl?: unknown };
      if (typeof body.sheetUrl !== "string") return NextResponse.json({ error: "A Google Sheets URL is required." }, { status: 400 });
      rows.push(...await fetchSheet(body.sheetUrl));
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not read the import." }, { status: 400 });
  }

  const result = await importRows(rows, dryRun);
  if (!dryRun) revalidatePath("/", "layout");
  return NextResponse.json(result);
}
