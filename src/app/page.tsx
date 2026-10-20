import Link from "next/link";
import { db } from "@/lib/db";
import { manufacturers } from "@/data/manufacturers";
import { EnquiryForm } from "@/components/EnquiryForm";
import { HeroCarousel, MetricCounters, ProductRow } from "@/components/HomeSections";
import type { CatalogProduct } from "@/components/ProductCard";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { isBlocked } from "@/lib/blocked";
import { getStaticCategories, getStaticProducts } from "@/lib/catalog-fallback";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = process.env.DATABASE_URL
    ? await Promise.all([
      db.product.findMany({ where: { published: true, status: "active" }, include: { category: true }, orderBy: { name: "asc" } }),
      db.product.findMany({ where: { published: true, status: "active" }, include: { category: true }, orderBy: { createdAt: "desc" } }),
      db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { published: true, status: "active" } } } } } }),
      db.blogPost.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    ]).catch(() => null)
    : null;
  const [dbTrending, dbArrivals, dbCategories, posts] = data ?? [[], [], [], []];
  const fallbackProducts = getStaticProducts();
  const mergeProducts = (primary: typeof dbTrending, fallback: typeof fallbackProducts) => {
    const bySlug = new Map([...fallback, ...primary].map((product) => [product.slug, product]));
    return [...bySlug.values()];
  };
  const trending = mergeProducts(dbTrending, fallbackProducts).sort((a, b) => a.name.localeCompare(b.name));
  const arrivals = mergeProducts(dbArrivals, fallbackProducts);
  const categories = dbCategories.length ? dbCategories : getStaticCategories();
  const products = (list: typeof trending) => list.filter((p) => !isBlocked(`${p.name} ${p.generic ?? ""} ${p.description}`)).slice(0, 8).map((p): CatalogProduct => ({ name: p.name, slug: p.slug, imageUrl: p.imageUrl, packSize: p.packSize, description: p.description, rx: p.rx, category: { name: p.category.name, slug: p.category.slug } }));
  const certDir = join(process.cwd(), "public", "certs");
  const certificates = existsSync(certDir) ? readdirSync(certDir).filter((name) => /\.(png|jpe?g|webp|svg)$/i.test(name)) : [];
  return <main id="main-content">
    <HeroCarousel />
    <section className="business-profile-band"><div className="container"><div className="section-heading"><div><span className="eyebrow">Ashutosh Pharma · Nagpur, India</span><h2>Wholesale and distribution for professional buyers</h2></div><Link className="text-link" href="/about">About us ↗</Link></div><div className="business-profile-grid"><article className="business-profile-card"><span>Nature of business</span><strong>Trader · Wholesaler · Distributor</strong></article><article className="business-profile-card"><span>Legal structure</span><strong>Proprietorship</strong></article><article className="business-profile-card"><span>Team size</span><strong>Up to 10 people</strong></article><article className="business-profile-card"><span>GST registration</span><strong>2024</strong></article></div></div></section>
    <ProductRow label="Trending Now" title="Explore featured products" products={products(trending)}/>
    <section className="trust-banner"><div className="container trust-banner-inner"><span className="eyebrow">A procurement partner you can reach</span><h2>Reliable conversations for medicine procurement.</h2><div className="trust-points"><p>Branded and generic medicines across a broad portfolio</p><p>Quality-focused sourcing and clear quote discussions</p><p>Regulatory documentation and import support</p><p>Responsive customer support</p></div><Link className="button button-light" href="/shop">See our products ↗</Link></div></section>
    <ProductRow label="Recently added" title="Explore the catalogue" products={products(arrivals)}/>
    <section className="section browse-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">Browse by therapeutic area</span><h2>Choose by area</h2></div><p>Explore published categories. Product availability is discussed with professional buyers.</p></div><div className="category-grid">{categories.map((cat, i) => <Link href={`/shop?cat=${cat.slug}`} className="category-tile" key={cat.id}><span className="category-icon" aria-hidden="true">{["✳", "◈", "⌬", "✣"][i % 4]}</span><strong>{cat.name}</strong><small>{cat._count.products} listed products</small></Link>)}</div><div className="manufacturer-section"><h3>Manufacturers</h3>{manufacturers.length ? <div className="manufacturer-grid">{manufacturers.map((name) => <span key={name}>{name}</span>)}</div> : <p className="form-note">Manufacturer names will appear here after distribution relationships are confirmed by the client.</p>}</div></div></section>
    <section className="supplier-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">Professional supply enquiries</span><h2>A considered partner for your supply needs.</h2></div><p>We focus on clear communication with importers and institutional buyers.</p></div>{certificates.length > 0 && <div className="certificate-strip" aria-label="Client-supplied certificates and logos">{certificates.map((file)=><Image key={file} src={`/certs/${encodeURIComponent(file)}`} alt="Client-supplied certificate or logo" width={180} height={100} unoptimized/>)}</div>}<MetricCounters/><p className="form-note">TODO: Replace each metric with client-verified figures before publishing. Only client-supplied certificate and logo files appear here.</p></div></section>
    <section className="section contact-section"><div className="container contact-grid"><div><span className="eyebrow">Start a conversation</span><h2>We offer a wide variety of products.</h2><p>Tell us what you are sourcing and our team will respond to your business enquiry.</p></div><div className="enquiry-panel"><h3>Contact our team</h3><EnquiryForm general/></div></div></section>
    <section className="section blog-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">Insights</span><h2>From the blog</h2></div><Link href="/blog" className="text-link">All articles ↗</Link></div>{posts.length ? <div className="blog-grid">{posts.map((post) => <article className="blog-card" key={post.id}><Link href={`/blog/${post.slug}`} className="blog-image"><Image src={post.imageUrl && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(post.imageUrl) ? post.imageUrl : "/blog-journal.svg"} alt="" fill sizes="(max-width:680px) 90vw, 33vw" unoptimized/></Link><span className="product-category">{post.category} · {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(post.createdAt)}</span><h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3><p>{post.excerpt}</p><Link className="text-link" href={`/blog/${post.slug}`}>Read more ↗</Link></article>)}</div> : <div className="empty-state">New trade insights will be published here. TODO: Add client-approved blog articles.</div>}</div></section>
  </main>;
}
