import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/EnquiryForm";
import { db } from "@/lib/db";
import { isBlocked } from "@/lib/blocked";
import { SingleEnquiryButton } from "@/components/SingleEnquiryButton";
import { AddProductButton } from "@/components/ProductCard";
import { site } from "@/config/site";
import { safeDatabaseQuery } from "@/lib/db-safe";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ slug: string }> };

function isConfiguredImageSource(source: string) {
  if (/^\/products\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(source)) return true;
  try {
    return new URL(source).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function isSafeExternalLink(source: string) {
  try {
    return ["https:", "http:"].includes(new URL(source).protocol);
  } catch {
    return false;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await safeDatabaseQuery(() => db.product.findUnique({ where: { slug } }), null);
  if (!product || !product.published || isBlocked(product.name)) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title: product.name, description: product.description.slice(0, 155) },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await safeDatabaseQuery(() => db.product.findUnique({ where: { slug }, include: { category: true } }), null);
  if (!product || !product.published || isBlocked(product.name)) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    category: product.category.name,
    brand: { "@type": "Organization", name: site.name },
  };
  const structuredDataJson = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return (
    <main className="content-section">
      <div className="container product-detail">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataJson }} />
        <div className="product-info">
          {product.imageUrl && isConfiguredImageSource(product.imageUrl) && <Image className="product-image" src={product.imageUrl} alt={product.name} width={640} height={640} sizes="(max-width: 760px) 100vw, 45vw" />}
          {product.imageUrl && !isConfiguredImageSource(product.imageUrl) && isSafeExternalLink(product.imageUrl) && <a className="text-link" href={product.imageUrl} target="_blank" rel="noreferrer">Open linked product image ↗</a>}
          <div className="prose-block">
            <p className="eyebrow">{product.category.name}</p>
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            {product.generic && <p><strong>Generic:</strong> {product.generic}</p>}
            {product.strength && <p><strong>Strength:</strong> {product.strength}</p>}
            {product.packSize && <p><strong>Pack:</strong> {product.packSize}</p>}
            {product.patentRestricted && <p>Enquiry only. Product availability is subject to applicable patent restrictions.</p>}
            <p><a className="text-link" href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Trade enquiry: ${product.name}`)}`}>Ask about this product on WhatsApp ↗</a></p>
            <div className="product-detail-actions"><AddProductButton product={product}/><SingleEnquiryButton product={product.name} slug={product.slug} rx={product.rx}/></div>
          </div>
        </div>
        <section className="enquiry-panel">
          <h2>Request a trade quote</h2>
          <p>For licensed importers and institutional buyers.</p>
          <EnquiryForm product={product.name} productSlug={product.slug} requiresLicence={product.rx} />
        </section>
      </div>
    </main>
  );
}
