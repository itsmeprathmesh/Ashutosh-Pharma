import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/EnquiryForm";
import { countries } from "@/data/countries";

type PageProps = { params: Promise<{ country: string }> };

export function generateStaticParams() {
  return countries.map(({ slug }) => ({ country: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country: slug } = await params;
  const country = countries.find((item) => item.slug === slug);
  if (!country) return {};
  return {
    title: `Trade enquiries for ${country.name}`,
    description: `Draft export enquiry information for licensed pharmaceutical importers in ${country.name}. Destination-specific requirements need professional review.`,
    alternates: {
      canonical: `/export/${country.slug}`,
      ...(country.slug === "brazil" ? { languages: { "en-US": "/export/brazil", "pt-BR": "/pt-br/export/brazil" } } : {}),
    },
    openGraph: { title: `Trade enquiries for ${country.name}`, description: `Draft trade enquiry information for licensed buyers in ${country.name}.` },
  };
}

export default async function ExportCountryPage({ params }: PageProps) {
  const { country: slug } = await params;
  const country = countries.find((item) => item.slug === slug);
  if (!country) notFound();

  return <main><section className="page-hero"><div className="container"><span className="eyebrow">Export market · Draft</span><h1>Trade enquiries for {country.name}</h1><p>This page is a draft for licensed importers, hospitals, and distributors. Country-specific import rules, documentation, and shipping details must be verified before publication.</p></div></section><section className="content-section"><div className="container country-layout"><div className="prose-block"><h2>Destination requirements</h2><p><strong>Regulator reference:</strong> {country.regulator}. TODO: verify the correct official medicines regulator and current rules with a qualified professional before launch.</p><p>TODO: Add original information specific to {country.name}, including only confirmed documentation, handling, and delivery details. Do not make claims about approvals, product registration, certifications, or guaranteed timelines without client evidence.</p><h2>Frequently asked questions</h2><ol className="faq-list">{["Which documents may be available for a trade enquiry?", "How can an importer share product requirements?", "How are destination requirements confirmed?", "Can product availability be confirmed before an order?", "How can a licensed buyer request a quotation?"].map((question) => <li key={question}><strong>{question}</strong><p>TODO: Add a country-specific answer after client and regulatory review.</p></li>)}</ol></div><section className="enquiry-panel"><h2>Request a trade quote</h2><p>For licensed business buyers.</p><EnquiryForm /></section></div></section></main>;
}
