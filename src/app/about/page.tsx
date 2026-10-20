import { site } from "@/config/site";

export const metadata = { title: "About Ashutosh Pharma", description: "Learn about Ashutosh Pharma, a Nagpur based pharmaceutical trader and wholesale distributor serving professional buyers.", alternates: { canonical: "/about" } };

const profile = [
  ["Nature of business", "Trader · Wholesaler · Distributor"],
  ["Legal structure", "Proprietorship"],
  ["Team size", "Up to 10 people"],
  ["GST registration", "2024"],
];

export default function AboutPage() {
  return <main id="main-content">
    <section className="page-hero"><div className="container"><span className="eyebrow">About Ashutosh Pharma</span><h1>Pharmaceutical wholesale and export enquiries from Nagpur, India.</h1><p>Ashutosh Pharma is a trader, wholesaler and distributor structured as a proprietorship. The business profile supplied for this website lists a team of up to 10 people and GST registration in 2024.</p></div></section>
    <section className="content-section"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">Business profile</span><h2>Company information</h2></div><p>Profile details supplied by the client.</p></div>
      <div className="business-profile-grid">{profile.map(([label, value]) => <article className="business-profile-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
      <div className="prose-block about-copy"><h2>A clear process for trade enquiries</h2><p>Based in Nagpur, India, Ashutosh Pharma supports pharmaceutical sourcing enquiries from licensed importers and institutional buyers. Buyers can share the products they are looking for, their destination market, pack requirements and relevant business documentation. The team reviews each request and confirms availability and destination requirements directly with the buyer.</p><p>This website is intended for B2B enquiries. It does not publish prices or offer consumer checkout. Product suitability, permissions and documentation should be confirmed with the appropriate professionals and authorities in the destination market.</p><p>GST and Import Export Code details are kept off the public page until verified against the client’s registration documents. Any third-party exporter verification status also requires current supporting evidence before it is displayed.</p><p><a href={`https://wa.me/${site.whatsapp}`}>Contact Ashutosh Pharma about a trade enquiry ↗</a></p></div>
    </div></section>
  </main>;
}
