import { site } from "@/config/site";

type LegalPlaceholderProps = { title: string; purpose: string };

export function LegalPlaceholder({ title, purpose }: LegalPlaceholderProps) {
  const detail = title.toLowerCase().includes("privacy")
    ? ["Information submitted through an enquiry form is used to respond to the request and follow up on the business conversation. Enquiry details are stored so the team can manage and respond to requests.", "This website uses hosting, database and email delivery services to operate its enquiry features. Do not include patient information or medical records in a message.", `For questions about an enquiry, contact ${site.email}.`]
    : title.toLowerCase().includes("refund") || title.toLowerCase().includes("returns")
      ? ["This website accepts trade enquiries only. It does not take orders, payments or consumer purchases online.", "Any supply, payment, cancellation, return or refund terms for a separately agreed transaction are confirmed in its written quotation or order documents.", "For an existing business transaction, contact the team using the details in your quotation or order correspondence."]
      : ["This website provides catalogue information and a way to contact Ashutosh Pharma about business requirements. Submitting an enquiry does not create an order or confirm product availability.", "Product details, availability, commercial terms, supporting documents and destination requirements are discussed for each request. Importers should confirm applicable local requirements with qualified advisers and relevant authorities.", `For questions about using this website, contact ${site.email}.`];
  return (
    <main id="main-content">
      <section className="page-hero"><div className="container"><span className="eyebrow">Ashutosh Pharma <span aria-hidden="true">/</span> Information</span><h1>{title}</h1><p>{purpose} for professional trade enquiries.</p></div></section>
      <section className="content-section"><div className="container prose-block legal-copy"><h2>{purpose}</h2>{detail.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>
    </main>
  );
}
