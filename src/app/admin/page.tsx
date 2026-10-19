import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [products, enquiries, newEnquiries, latest] = await Promise.all([
    db.product.count(),
    db.enquiry.count(),
    db.enquiry.count({ where: { status: "new" } }),
    db.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return <main className="admin-main"><div className="admin-heading"><div><span className="eyebrow">Secure workspace</span><h1>Enquiry dashboard</h1></div><div className="admin-links"><Link className="button button-small button-outline" href="/admin/import">Import products</Link><Link className="button button-small" href="/admin/products">Manage products</Link></div></div><div className="admin-stats"><article><span>Products</span><strong>{products}</strong></article><article><span>All enquiries</span><strong>{enquiries}</strong></article><article><span>New enquiries</span><strong>{newEnquiries}</strong></article></div><div className="admin-section-heading"><h2>Recent enquiries</h2><Link className="text-link" href="/admin/enquiries">View all →</Link></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>Date</th><th>Name</th><th>Country</th><th>Product</th><th>Status</th></tr></thead><tbody>{latest.map((row) => <tr key={row.id}><td>{row.createdAt.toISOString().slice(0, 10)}</td><td>{row.name}</td><td>{row.country}</td><td>{row.product}</td><td><span className={`status status-${row.status}`}>{row.status}</span></td></tr>)}</tbody></table>{latest.length === 0 && <p className="empty-state">No enquiries have arrived yet.</p>}</div></main>;
}
