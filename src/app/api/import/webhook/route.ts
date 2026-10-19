import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { fetchSheet, importRows } from "@/lib/import";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expected = process.env.IMPORT_SECRET;
  const supplied = request.headers.get("x-sync-secret") ?? "";
  if (!expected || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheetUrl = process.env.SHEET_URL;
  if (!sheetUrl) return NextResponse.json({ error: "SHEET_URL is not configured" }, { status: 503 });
  try {
    const result = await importRows(await fetchSheet(sheetUrl));
    revalidatePath("/", "layout");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Google Sheets import failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import failed" }, { status: 400 });
  }
}
