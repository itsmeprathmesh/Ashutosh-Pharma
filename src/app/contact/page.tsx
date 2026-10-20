import { site } from "@/config/site";
import { EnquiryForm } from "@/components/EnquiryForm";

export const metadata = { title: "Contact our trade team", description: "Contact Ashutosh Pharma with a pharmaceutical sourcing enquiry for licensed importers and institutional buyers.", alternates: { canonical: "/contact" } };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  return <main id="main-content"><section className="page-hero"><div className="container"><span className="eyebrow">Contact</span><h1>Tell us what you’re looking for.</h1><p>For licensed importers, hospitals, and distributors. Share your product requirements and destination market.</p></div></section><section className="content-section"><div className="container product-detail"><div className="prose-block"><h2>Trade enquiries</h2><p>WhatsApp: <a href={`https://wa.me/${site.whatsapp}`}>{site.phone}</a></p><p>Email: {site.email}</p><p>Location: {site.address}</p>{product && <p>Product of interest: {product}</p>}<div className="map-placeholder" role="img" aria-label={`Map location placeholder for ${site.address}`}>Map placeholder · {site.address}</div></div><section className="enquiry-panel"><h2>Send a trade enquiry</h2><EnquiryForm product={product} general={!product}/></section></div></section></main>;
}
