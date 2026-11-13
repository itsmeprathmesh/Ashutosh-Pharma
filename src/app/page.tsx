import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CategoryScroller } from "@/components/CategoryScroller";
import { EnquiryForm } from "@/components/EnquiryForm";
import { ProductCard, type CatalogProduct } from "@/components/ProductCard";
import { QuickQuotePanel } from "@/components/QuickQuotePanel";
import { isBlocked } from "@/lib/blocked";
import { getPricePresentation } from "@/lib/currency";
import { getHomeData } from "@/lib/public-data";
import { safeDatabaseQuery } from "@/lib/db-safe";
import { site } from "@/config/site";
import { getStaticCategories, getStaticProducts } from "@/lib/catalog-fallback";

export const dynamic = "force-dynamic";

const businessFacts = [
  { value: "Trader · Wholesaler · Distributor", label: "Business" },
  { value: "2024", label: "GST registered since" },
  { value: "Nagpur, India", label: "Based in" },
  { value: "Up to 10", label: "Team" },
];

const serviceNotes = [
  "A broad portfolio of branded and generic medicines.",
  "Quotes discussed clearly, product by product.",
  "Regulatory documentation and import support.",
  "Responsive support for professional buyers.",
];

export default async function Home() {
  const data = process.env.DATABASE_URL && process.env.TEST_DATABASE_ENABLED !== "false"
    ? await safeDatabaseQuery(() => getHomeData(), null)
    : null;
  const fallbackProducts = getStaticProducts();
  const [dbFeatured, dbArrivals, dbCategories, offers, reviews, posts, showPrices] = data ?? [[], [], [], [], [], [], true];
  const catalogFeatured = dbFeatured.length ? dbFeatured : fallbackProducts;
  const catalogArrivals = dbArrivals.length ? dbArrivals : fallbackProducts;
  const categories = dbFeatured.length && dbCategories.length ? dbCategories : getStaticCategories();
  const visible = (product: (typeof catalogFeatured)[number]) =>
    !isBlocked(`${product.name} ${product.generic ?? ""} ${product.description}`);
  const featured = catalogFeatured.filter(visible).slice(0, 10);
  const arrivals = catalogArrivals.filter(visible).slice(0, 8);
  const toCard = (product: (typeof featured)[number]): CatalogProduct => ({
    name: product.name,
    slug: product.slug,
    images: product.images,
    imageUrl: product.imageUrl,
    strength: product.strength,
    packSize: product.packSize,
    description: product.description,
    rx: product.rx,
    category: { name: product.category.name, slug: product.category.slug },
    price: getPricePresentation({ globalEnabled: showPrices, productEnabled: product.showPrice, priceInr: product.priceInr, priceUnit: product.priceUnit }),
  });

  return <main id="main-content">
    <section className="home-hero">
      <div className="container home-hero-grid">
        <div className="home-hero-copy">
          <span className="eyebrow">Ashutosh Pharma <span aria-hidden="true">/</span> Nagpur, India</span>
          <h1>Medicine supply, built around a <em>clear conversation.</em></h1>
          <p>Trade enquiries for licensed importers, distributors and institutional buyers. Tell us what you need and where it is going.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/contact">Request a quote <ArrowUpRight size={17}/></Link><Link className="button button-secondary" href="/shop">Browse catalogue <ArrowRight size={16}/></Link></div>
          <dl className="hero-facts">{businessFacts.map((fact, index) => <div key={fact.label}><dt>{fact.label}</dt><dd className={index === 0 ? "fact-business" : ""}>{fact.value}</dd></div>)}</dl>
        </div>
        <QuickQuotePanel/>
      </div>
    </section>

    <CategoryScroller categories={categories}/>

    {featured.length > 0 && <section className="home-section featured-section">
      <div className="container">
        <div className="section-heading-row"><div><span className="eyebrow">Selected catalogue</span><h2>Products for your next enquiry</h2><p className="section-intro">Specifications and availability are confirmed with each trade request.</p></div><Link className="text-link" href="/shop">Full catalogue <ArrowRight size={15}/></Link></div>
        <div className="product-grid featured-product-grid">{featured.map((product, index) => <ProductCard key={product.id} product={toCard(product)} number={index + 1}/>)}</div>
        {showPrices && featured.some((product) => product.showPrice && Number(product.priceInr) > 0) && <p className="price-disclaimer">Indicative price, excluding GST, shipping and duties. Final quote on request.</p>}
      </div>
    </section>}

    {offers.length > 0 && <section className="offers-section" id="offers" aria-label="Current offers"><div className="container offers-grid">{offers.map((offer) => <article className="offer-card" key={offer.id}><span className="eyebrow">Trade notice</span><h2>{offer.title}</h2><p>{offer.shortText}</p>{offer.validUntil && <time dateTime={offer.validUntil.toISOString()}>Valid until {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(offer.validUntil)}</time>}<Link href={offer.buttonUrl?.startsWith("/") && !offer.buttonUrl.startsWith("//") && !offer.buttonUrl.includes("\\") ? offer.buttonUrl : "/contact"} className="text-link">{offer.buttonText || "Discuss this offer"} <ArrowUpRight size={15}/></Link></article>)}</div></section>}

    {arrivals.length > 0 && <section className="home-section arrival-section"><div className="container"><div className="section-heading-row"><div><span className="eyebrow">Recently added</span><h2>New in the catalogue</h2></div><Link className="text-link" href="/shop?sort=newest">See new arrivals <ArrowRight size={15}/></Link></div><div className="product-grid">{arrivals.map((product) => <ProductCard key={product.id} product={toCard(product)}/>)}</div></div></section>}

    <section className="home-section why-section"><div className="container why-grid"><div className="why-intro"><span className="eyebrow">Working together</span><h2>Clear information.<br/>Responsive people.</h2><p>Support for professional pharmaceutical procurement, from the first product list to destination requirements.</p></div><div className="why-statements">{serviceNotes.map((text, index) => <p key={text}><span className="mono-mark">0{index + 1}</span>{text}</p>)}</div></div></section>

    {reviews.length > 0 && <section className="home-section reviews-section"><div className="container"><div className="section-heading-row"><div><span className="eyebrow">Approved buyer feedback</span><h2>What buyers have shared</h2></div></div><div className="review-layout"><figure className="review-feature"><blockquote>“{reviews[0].quote}”</blockquote><figcaption><strong>{reviews[0].name}</strong><span>{reviews[0].company} · {reviews[0].country}</span><time dateTime={reviews[0].reviewDate.toISOString()}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(reviews[0].reviewDate)}</time></figcaption></figure>{reviews.length > 1 && <div className="review-list">{reviews.slice(1).map((review) => <article key={review.id}><p>“{review.quote}”</p><span>{review.name} · {review.company}, {review.country}</span><time dateTime={review.reviewDate.toISOString()}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(review.reviewDate)}</time></article>)}</div>}</div></div></section>}

    {posts.length > 0 && <section className="home-section blog-section"><div className="container"><div className="section-heading-row"><div><span className="eyebrow">From the journal</span><h2>Trade notes and updates</h2></div><Link className="text-link" href="/blog">All articles <ArrowRight size={15}/></Link></div><div className="blog-grid">{posts.map((post, index) => <article className="blog-card" key={post.id}><Link href={`/blog/${post.slug}`} className="blog-type-art" aria-label={`Read ${post.title}`}><span className="mono-mark">0{index + 1}</span><span>{post.category}</span></Link><div className="blog-card-copy"><span className="product-category">{post.category} · {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(post.createdAt)}</span><h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3><p>{post.excerpt}</p><Link className="text-link" href={`/blog/${post.slug}`}>Read article <ArrowRight size={15}/></Link></div></article>)}</div></div></section>}

    <section className="home-contact-section"><div className="container home-contact-grid"><div><span className="eyebrow">Start a trade conversation</span><h2>Send your requirement to our team.</h2><p>Share the details that will help us understand your product and market.</p><Link className="contact-detail" href={`mailto:${site.email}`}>{site.email}<ArrowUpRight size={15}/></Link><Link className="contact-detail" href={`https://wa.me/${site.whatsapp}`}>WhatsApp {site.phone}<ArrowUpRight size={15}/></Link></div><div className="enquiry-panel"><h3>General enquiry</h3><EnquiryForm general/></div></div></section>
  </main>;
}
