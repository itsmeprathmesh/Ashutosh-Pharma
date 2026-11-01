import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { fetchSheet, importRows } from "@/lib/import";
import { timingSafeStringEqual } from "@/lib/secret-compare";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expected = process.env.IMPORT_SECRET;
  const supplied = request.headers.get("x-sync-secret") ?? "";
  if (!expected || !timingSafeStringEqual(supplied, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheetUrl = process.env.SHEET_URL;
  if (!sheetUrl) return NextResponse.json({ error: "Import service is not configured." }, { status: 503 });
  try {
    const result = await importRows(await fetchSheet(sheetUrl));
    revalidateTag("public-catalog", "max");
    revalidatePath("/", "layout");
    return NextResponse.json(result);
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "sheet_import_failed", errorName: error instanceof Error ? error.name : "unknown" }));
    return NextResponse.json({ error: "Import failed. Check the sheet URL and contents." }, { status: 400 });
  }
}
