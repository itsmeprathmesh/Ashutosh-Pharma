import Link from "next/link";
import { db } from "@/lib/db";
import { updateEnquiryStatus } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ status?: string; country?: string }> };

export default async function EnquiriesPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const rows = await db.enquiry.findMany({
    where: {
      ...(filters.status && ["new", "contacted", "closed"].includes(filters.status) ? { status: filters.status } : {}),
      ...(filters.country ? { country: { contains: filters.country, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { items: true },
  });

  return <main className="admin-main"><div className="admin-heading"><div><span className="eyebrow">Admin</span><h1>Enquiries</h1></div><Link className="button button-small button-outline" href="/api/admin/enquiries.csv">Download CSV</Link></div><form className="catalog-toolbar" action="/admin/enquiries"><select className="field" name="status" defaultValue={filters.status ?? ""}><option value="">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select><input className="field" name="country" defaultValue={filters.country} placeholder="Filter by country"/><button className="button" type="submit">Filter</button></form><div className="table-wrap"><table className="admin-table"><thead><tr><th>Date</th><th>Name / company</th><th>Country</th><th>Products / quantity</th><th>Licence</th><th>Documents</th><th>Email</th><th>Status</th></tr></thead><tbody>{rows.map((row) => { const files = [...(row.message?.matchAll(/https:\/\/[^\s,]+\.private\.blob\.vercel-storage\.com\/enquiry-documents\/[^\s,]+/g) ?? [])].map((match) => match[0]); return <tr key={row.id}><td>{row.createdAt.toISOString().slice(0, 10)}</td><td>{row.name}<small>{row.company}</small></td><td>{row.country}</td><td>{row.items.length ? row.items.map((item) => `${item.product} · ${item.quantity}`).join("; ") : row.product}<small>{row.quantity}</small></td><td>{row.licenceNo || "—"}</td><td>{files.length ? files.map((file, index) => <a key={file} className="text-link" href={`/api/admin/enquiry-file?url=${encodeURIComponent(file)}`}>Document {index + 1}</a>) : "—"}</td><td><a href={`mailto:${row.email}`}>{row.email}</a></td><td><form action={updateEnquiryStatus}><input type="hidden" name="id" value={row.id}/><select name="status" defaultValue={row.status} aria-label={`Status for ${row.name}`}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select><button className="table-save" type="submit">Save</button></form></td></tr>; })}</tbody></table>{rows.length === 0 && <p className="empty-state">No enquiries match these filters.</p>}</div></main>;
}
