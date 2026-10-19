export const site = {
  name: "Ashutosh Pharma",
  shortName: "Ashutosh",
  description: "Pharmaceutical sourcing and export enquiries for licensed importers and institutional buyers.",
  phone: "+91 80438 21323",
  whatsapp: "918043821323",
  email: "TODO: confirm the business email with the client",
  address: "Nagpur, Maharashtra, India",
  drugLicenceNumber: "TODO: verify the drug licence number against client documents",
  metrics: { products: null, clients: null, years: null, countries: null }, // TODO: replace only with client-verified figures.
  slides: [
    { headline: "A reliable partner for medicine procurement.", text: "A clear, responsive enquiry process for licensed importers and institutional buyers.", image: "/hero-medicines.svg", alt: "Illustrated medicine carton and capsules" },
    { headline: "A broad portfolio, handled with care.", text: "Tell our team what your market needs and receive a considered trade response.", image: "/hero-vials.svg", alt: "Illustrated pharmaceutical vials" },
    { headline: "Your requirements. A thoughtful response.", text: "Product, destination and documentation discussions start with one enquiry.", image: "/hero-care.svg", alt: "Illustrated healthcare and medicine packaging" },
  ],
} as const;
