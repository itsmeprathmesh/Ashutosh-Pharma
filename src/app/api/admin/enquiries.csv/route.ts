import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { csvCell } from "@/lib/csv-safe";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await requireAdmin()) return Response.json({ error: "Authentication required." }, { status: 401 });
  try {
    const rows = await db.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
    const columns = ["date", "name", "company", "email", "phone", "country", "product", "quantity", "licenceNo", "message", "status"] as const;
    const csv = [columns.join(","), ...rows.map((row) => [row.createdAt.toISOString(), row.name, row.company, row.email, row.phone, row.country, row.product, row.quantity, row.licenceNo, row.message, row.status].map(csvCell).join(","))].join("\r\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=ashutosh-enquiries.csv", "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Could not generate the enquiry export." }, { status: 503 }); }
}
