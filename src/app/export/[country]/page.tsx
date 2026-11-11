import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { EnquiryForm } from "@/components/EnquiryForm";
import { countries } from "@/data/countries";

type PageProps = { params: Promise<{ country: string }> };

export function generateStaticParams() { return countries.map(({ slug }) => ({ country: slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country: slug } = await params;
  const country = countries.find((item) => item.slug === slug);
  if (!country) return {};
  return {
    title: `Trade enquiries for ${country.name}`,
    description: `Contact Ashutosh Pharma with a pharmaceutical trade enquiry for ${country.name}.`,
    alternates: { canonical: `/export/${country.slug}`, ...(country.slug === "brazil" ? { languages: { "en-US": "/export/brazil", "pt-BR": "/pt-br/export/brazil" } } : {}) },
    openGraph: { title: `Trade enquiries for ${country.name}`, description: `Trade enquiry contact for professional buyers in ${country.name}.` },
  };
}

export default async function ExportCountryPage({ params }: PageProps) {
  const { country: slug } = await params;
  const country = countries.find((item) => item.slug === slug);
  if (!country) notFound();
  return <main id="main-content"><section className="page-hero"><div className="container"><span className="eyebrow">Destination enquiry <span aria-hidden="true">/</span> {country.name}</span><h1>Discuss a trade requirement<br/><em>for {country.name}.</em></h1><p>Ashutosh Pharma works with professional buyers on pharmaceutical sourcing enquiries. Availability, supporting documents and destination-market requirements are confirmed case by case.</p></div></section><section className="content-section"><div className="container country-layout"><div className="prose-block country-copy"><span className="eyebrow">Before an enquiry</span><h2>Share the details that matter.</h2><p>Tell us the product, pack requirement and intended destination. Our team will discuss the information available for your enquiry.</p><p>Importers are responsible for confirming local authorisations and import requirements with their qualified advisers and relevant authorities. A website enquiry does not confirm product availability or an order.</p><Link className="text-link" href="/shop">Browse the catalogue <ArrowUpRight size={15}/></Link><h2>Common questions</h2><ol className="faq-list"><li><strong>What should I include?</strong><p>Product name, quantity, destination and business contact details.</p></li><li><strong>Does an enquiry confirm supply?</strong><p>No. Product availability and terms are discussed separately for each request.</p></li><li><strong>Are destination requirements confirmed here?</strong><p>No. Importers should verify local requirements before placing an order.</p></li></ol></div><section className="enquiry-panel"><span className="eyebrow">For licensed trade buyers</span><h2>Request a quote</h2><EnquiryForm/></section></div></section></main>;
}
