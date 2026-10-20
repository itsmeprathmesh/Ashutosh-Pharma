export const site = {
  name: "Ashutosh Pharma",
  shortName: "Ashutosh Pharma",
  description:
    "Pharmaceutical sourcing and export enquiries for licensed importers and institutional buyers.",
  phone: "+91 8657563689",
  whatsapp: "8657563689",
  email: "ashutoshpharma793@gmail.com",
  address:
    "BLOCK NO. 3, FIRST FLOOR, HOUSE NO. 446/A/79A,  PLOT NO. 79 SHREE RAM WADI, NEAR CHANDSI CLINIC, NARAYANPETH , PREM NAGAR, NAGPUR Tal : NAGPUR URBAN ( NAGPUR ZONE 2 )",
  drugLicenceNumber: "MH-NG2-561640",
  metrics: { products: null, clients: null, years: null, countries: null }, // TODO: replace only with client-verified figures.
  slides: [
    {
      headline: "A reliable partner for medicine procurement.",
      text: "A clear, responsive enquiry process for licensed importers and institutional buyers.",
      image: "/hero-medicines.svg",
      alt: "Illustrated medicine carton and capsules",
    },
    {
      headline: "A broad portfolio, handled with care.",
      text: "Tell our team what your market needs and receive a considered trade response.",
      image: "/hero-vials.svg",
      alt: "Illustrated pharmaceutical vials",
    },
    {
      headline: "Your requirements. A thoughtful response.",
      text: "Product, destination and documentation discussions start with one enquiry.",
      image: "/hero-care.svg",
      alt: "Illustrated healthcare and medicine packaging",
    },
  ],
} as const;
