import { ProductCard } from "@/components/ProductCard";
import { isBlocked } from "@/lib/blocked";
import { db } from "@/lib/db";
import { safeDatabaseQuery } from "@/lib/db-safe";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Oncology portfolio",
  description: "Trade enquiries for oncology products from licensed importers and institutional buyers.",
  alternates: { canonical: "/oncology" },
};

export default async function Oncology() {
  const listed = await safeDatabaseQuery(() => db.product.findMany({
    where: {
      published: true,
      status: "active",
      category: { name: { contains: "oncology", mode: "insensitive" } },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      generic: true,
      description: true,
      images: true,
      imageUrl: true,
      packSize: true,
      rx: true,
      category: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  }), []);
  const products = listed.filter((product) =>
    !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`),
  );

  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">For licensed importers</span>
          <h1>Oncology portfolio</h1>
          <p>Enquiries for oncology products are handled with additional care. Availability, destination-market permissions and supporting documents must be confirmed before any supply discussion.</p>
        </div>
      </section>
      <section className="content-section">
        <div className="container">
          {products.length ? (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={{
                  name: product.name,
                  slug: product.slug,
                  images: product.images,
                  imageUrl: product.imageUrl,
                  packSize: product.packSize,
                  rx: product.rx,
                  category: product.category,
                }} />
              ))}
            </div>
          ) : (
            <div className="empty-state">No oncology products are currently listed. Contact the team with a licensed trade enquiry.</div>
          )}
        </div>
      </section>
    </main>
  );
}
