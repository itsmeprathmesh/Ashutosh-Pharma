import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/EnquiryForm";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductCard, AddProductButton } from "@/components/ProductCard";
import { SingleEnquiryButton } from "@/components/SingleEnquiryButton";
import { site } from "@/config/site";
import { isBlocked } from "@/lib/blocked";
import { getPricePresentation } from "@/lib/currency";
import { safeDatabaseQuery } from "@/lib/db-safe";
import { getPublicPriceSetting, getPublicProduct, getRelatedProducts } from "@/lib/public-data";
import { jsonForHtml } from "@/lib/json-safe";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await safeDatabaseQuery(() => getPublicProduct(slug), null);
  if (!product || isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`)) return {};
  return { title: product.name, description: product.description.slice(0, 155), alternates: { canonical: `/product/${product.slug}` }, openGraph: { title: product.name, description: product.description.slice(0, 155) } };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await safeDatabaseQuery(() => getPublicProduct(slug), null);
  if (!product || isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`)) notFound();
  const [globalPriceSwitch, relatedRows] = await Promise.all([
    safeDatabaseQuery(() => getPublicPriceSetting(), false),
    safeDatabaseQuery(() => getRelatedProducts(product.categoryId, product.id), []),
  ]);
  const price = getPricePresentation({ globalEnabled: globalPriceSwitch, productEnabled: product.showPrice, priceInr: product.priceInr, priceUnit: product.priceUnit });
  const related = relatedRows.filter((item) => !isBlocked(`${item.name} ${item.generic ?? ""} ${item.description}`)).slice(0, 4).map((item) => ({
    ...item,
    price: getPricePresentation({ globalEnabled: globalPriceSwitch, productEnabled: item.showPrice, priceInr: item.priceInr, priceUnit: item.priceUnit }),
  }));
  const canonical = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ashutoshpharmaa.com"}/product/${product.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.length ? product.images : product.imageUrl ?? undefined,
    category: product.category.name,
    brand: { "@type": "Organization", name: site.name },
    url: canonical,
    ...(price ? { offers: { "@type": "Offer", price: Number(product.priceInr), priceCurrency: "INR" } } : {}),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ashutoshpharmaa.com" },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ashutoshpharmaa.com"}/shop` },
      { "@type": "ListItem", position: 3, name: product.category.name, item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ashutoshpharmaa.com"}/category/${product.category.slug}` },
      { "@type": "ListItem", position: 4, name: product.name, item: canonical },
    ],
  };
  const cspNonce = (await headers()).get("x-nonce") ?? undefined;
  const productJson = jsonForHtml(structuredData);
  const breadcrumbJson = jsonForHtml(breadcrumbs);
  const whatsappHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Trade enquiry: ${product.name}`)}`;
  const specs = [["Composition", product.generic], ["Strength", product.strength], ["Pack size", product.packSize], ["Form", product.form], ["Prescription", product.rx ? "Yes · licensed importers" : "No prescription flag"]] as const;

  return <main id="main-content" className="content-section product-page">
    <div className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/shop">Shop</Link><span>/</span><Link href={`/category/${product.category.slug}`}>{product.category.name}</Link><span>/</span><span aria-current="page">{product.name}</span></nav>
      <script type="application/ld+json" nonce={cspNonce} dangerouslySetInnerHTML={{ __html: productJson }}/>
      <script type="application/ld+json" nonce={cspNonce} dangerouslySetInnerHTML={{ __html: breadcrumbJson }}/>
      <div className="product-detail product-detail-redesign">
        <ProductGallery name={product.name} images={[...product.images, ...(product.imageUrl ? [product.imageUrl] : [])]}/>
        <section className="product-detail-copy"><Link className="eyebrow" href={`/category/${product.category.slug}`}>{product.category.name}</Link><h1>{product.name}</h1>{product.patentRestricted && <p className="patent-note">Enquiry only. Product availability is subject to applicable patent restrictions.</p>}
          <table className="product-spec-table"><tbody>{specs.map(([label, value]) => value ? <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr> : null)}</tbody></table>
          {price && <div className="product-price-block"><p className="product-price-current">{price.inr}</p><p className="price-disclaimer">Indicative wholesale price in INR, excluding GST, shipping and duties. Final quote on request.</p></div>}
          <p className="product-description">{product.description}</p>
          <div className="product-detail-actions"><AddProductButton product={product}/><a className="button button-outline" href={whatsappHref} target="_blank" rel="noreferrer">Ask on WhatsApp</a>{process.env.DATABASE_URL && <SingleEnquiryButton product={product.name} slug={product.slug} rx={product.rx}/>}</div>
          <p className="documentation-note">Supplied against valid import documentation.</p>
        </section>
      </div>
      {process.env.DATABASE_URL && <section id="quote" className="enquiry-panel product-enquiry-panel"><h2>Request a trade quote</h2><p>For licensed importers and institutional buyers.</p><EnquiryForm product={product.name} productSlug={product.slug} requiresLicence={product.rx}/></section>}
      {related.length > 0 && <section className="related-products"><div className="section-heading-row"><div><span className="eyebrow">More in {product.category.name}</span><h2>Related products</h2></div><Link className="text-link" href={`/category/${product.category.slug}`}>View category</Link></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item}/>)}</div></section>}
    </div>
  </main>;
}
