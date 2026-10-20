import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";

export const metadata = {
  title: "About Ashutosh Pharma",
  description: "Company profile, wholesale and export work, and business information for Ashutosh Pharma in Nagpur, India.",
  alternates: { canonical: "/about" },
};

const companyFacts = [
  ["Nature of business", "Trader · Wholesaler · Distributor"],
  ["Additional business", "Retail and wholesale"],
  ["Company CEO", "Sumit Padole"],
  ["Team size", "Up to 10 people"],
  ["Established", "2024"],
  ["Legal status", "Proprietorship"],
  ["Top export markets", "United States, United Kingdom, Ireland, Poland, Netherlands"],
];

const facilities = [
  { src: "/about/office-setup.jpg", alt: "Ashutosh Pharma office workspace", title: "Office set-up", caption: "Our office" },
  { src: "/about/warehouse.jpg", alt: "Shelving and packaged stock at Ashutosh Pharma", title: "Warehouse", caption: "Our stock" },
  { src: "/about/signboard.jpg", alt: "Ashutosh Pharma signboard in Nagpur", title: "Infrastructure", caption: "Our signboard" },
];

export default function AboutPage() {
  return <main id="main-content">
    <section className="page-hero"><div className="container"><span className="eyebrow">About Ashutosh Pharma</span><h1>Pharmaceutical wholesale and export enquiries from Nagpur, India.</h1><p>Established in 2024, Ashutosh Pharma is a pharmaceutical trader, wholesaler and distributor dealing in tablets, capsules, lotions and other healthcare products. The supplied company profile names Sumit Padole as CEO and describes a focus on quality and customer satisfaction.</p></div></section>

    <section className="content-section"><div className="container about-content">
      <section className="about-intro prose-block"><h2>Our work</h2><p>Ashutosh Pharma works with pharmaceutical products and healthcare supplies for professional buyers. The company profile describes a growing portfolio intended to serve the needs of healthcare providers and procurement teams.</p><p>We aim to make trade enquiries clear and responsive. Buyers can share product requirements, destination markets, pack requirements and relevant business documentation. Availability, product suitability, supporting documents and destination requirements are confirmed for each enquiry.</p><p>This website is for B2B enquiries. It does not publish public prices or offer consumer checkout. Prescription products require an importer licence for an enquiry. Product permissions and import requirements should be confirmed with the relevant professionals and authorities.</p></section>

      <section className="about-facts"><div className="section-heading"><div><span className="eyebrow">Company profile</span><h2>Business factsheet</h2></div><p>Key information about our business.</p></div><dl className="factsheet-grid">{companyFacts.map(([label, value]) => <div className="factsheet-item" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>

      <section className="about-markets prose-block"><h2>Client service and export markets</h2><p>The supplied profile describes Ashutosh Pharma as an export pharmaceutical business serving clients with professional import and export support. It mentions the United States, United Kingdom, Canada, New Zealand, Australia, France, the Netherlands and India; the factsheet separately lists the United States, United Kingdom, Ireland, Poland and the Netherlands as top export markets. Actual product availability, destination eligibility, documentation and shipping arrangements are confirmed case by case.</p></section>

      <section className="about-facilities"><div className="section-heading"><div><span className="eyebrow">Our workplace</span><h2>Infrastructure and set-up</h2></div><p>A look at our office, warehouse and company frontage.</p></div><div className="facility-grid">{facilities.map((facility) => <figure className="facility-card" key={facility.src}><div className="facility-image"><Image src={facility.src} alt={facility.alt} fill sizes="(max-width: 700px) 92vw, 33vw" /></div><figcaption><strong>{facility.title}</strong><span>{facility.caption}</span></figcaption></figure>)}</div></section>

      <section className="about-reviews"><div className="section-heading"><div><span className="eyebrow">IndiaMART profile</span><h2>Ratings and reviews</h2></div><p>Customer feedback displayed on IndiaMART.</p></div><div className="rating-summary"><div className="rating-score"><strong>4.3</strong><span>/ 5</span><div aria-label="4.3 out of 5 stars">★★★★☆</div><small>55 ratings</small></div><div className="satisfaction-grid"><div><strong>81%</strong><span>Response</span></div><div><strong>77%</strong><span>Quality</span></div><div><strong>73%</strong><span>Delivery</span></div></div></div><p className="form-note">Ratings and counts are shown as listed on IndiaMART and may change.</p></section>

      <section className="about-contact"><h2>Discuss a trade requirement</h2><p>Contact Ashutosh Pharma to discuss pharmaceutical sourcing enquiries.</p><Link className="button" href={`https://wa.me/${site.whatsapp}`}>Contact our team ↗</Link></section>
    </div></section>
  </main>;
}
