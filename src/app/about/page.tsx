import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/config/site";

export const metadata = {
  title: "About Ashutosh Pharma",
  description: "Ashutosh Pharma is a Nagpur-based trader, wholesaler and distributor serving professional pharmaceutical buyers.",
  alternates: { canonical: "/about" },
};

const facts = [
  ["Business", "Trader · Wholesaler · Distributor"],
  ["GST registration", "Since 2024"],
  ["Location", "Nagpur, India"],
  ["Team", "Up to 10 people"],
];

export default function AboutPage() {
  return <main id="main-content">
    <section className="page-hero"><div className="container"><span className="eyebrow">Company profile <span aria-hidden="true">/</span> Nagpur, India</span><h1>Trade medicine supply,<br/><em>with people close by.</em></h1><p>Ashutosh Pharma is a trader, wholesaler and distributor based in Nagpur. We work with professional buyers on product, destination and documentation requirements.</p></div></section>
    <section className="content-section about-page-content"><div className="container">
      <div className="about-statement"><span className="eyebrow">Our work</span><div><h2>Start with the requirement.</h2><p>Buyers can share product names, pack requirements and destination markets. Our team discusses availability, supporting documents and import requirements for each enquiry.</p><p>This website supports business enquiries. It does not provide consumer checkout. Prescription products are handled for licensed importers; relevant licence details are requested when required.</p><Link className="text-link" href="/contact">Contact the team <ArrowUpRight size={15}/></Link></div></div>
      <section className="about-facts"><div className="section-heading-row"><div><span className="eyebrow">At a glance</span><h2>Business factsheet</h2></div></div><dl className="factsheet-grid">{facts.map(([label, value], index) => <div className="factsheet-item" key={label}><dt className="mono-mark">0{index + 1} <span>{label}</span></dt><dd>{value}</dd></div>)}</dl></section>
      <section className="about-contact"><div><span className="eyebrow">Ashutosh Pharma</span><h2>Discuss a trade requirement.</h2><p>Send the product, quantity and destination market to our team.</p></div><Link className="button button-primary" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp our team <ArrowUpRight size={16}/></Link></section>
    </div></section>
  </main>;
}
