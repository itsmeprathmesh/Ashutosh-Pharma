import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const rows = await db.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
  const columns = ["date", "name", "company", "email", "phone", "country", "product", "quantity", "licenceNo", "message", "status"] as const;
  const csv = [columns.join(","), ...rows.map((row) => [row.createdAt.toISOString(), row.name, row.company, row.email, row.phone, row.country, row.product, row.quantity, row.licenceNo, row.message, row.status].map(csvCell).join(","))].join("\r\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=ashutosh-enquiries.csv", "Cache-Control": "no-store" } });
}
