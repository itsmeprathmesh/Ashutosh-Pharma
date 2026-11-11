import { ArrowUpRight } from "lucide-react";
import { EnquiryForm } from "@/components/EnquiryForm";
import { site } from "@/config/site";

export const metadata = { title: "Contact our trade team", description: "Contact Ashutosh Pharma with a pharmaceutical sourcing enquiry for licensed importers and institutional buyers.", alternates: { canonical: "/contact" } };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  return <main id="main-content">
    <section className="page-hero"><div className="container"><span className="eyebrow">Contact <span aria-hidden="true">/</span> Trade enquiries</span><h1>Tell us what<br/><em>you’re sourcing.</em></h1><p>For licensed importers, distributors and institutional buyers. Share the product and destination market with our Nagpur team.</p></div></section>
    <section className="content-section"><div className="container contact-page-grid"><div className="contact-page-details"><span className="eyebrow">Ashutosh Pharma</span><h2>Speak with our team.</h2><p>Availability and destination requirements are discussed for each enquiry.</p>{product && <p className="contact-product-note">Product of interest: <strong>{product}</strong></p>}<a href={`mailto:${site.email}`}>{site.email}<ArrowUpRight size={16}/></a><a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp {site.phone}<ArrowUpRight size={16}/></a><address>{site.address}</address></div><section className="enquiry-panel"><span className="eyebrow">Write to us</span><h2>{product ? "Product enquiry" : "General enquiry"}</h2><EnquiryForm product={product} general={!product}/></section></div></section>
  </main>;
}
