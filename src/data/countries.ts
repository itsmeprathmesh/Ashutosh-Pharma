export type Country = {
  slug: string;
  name: string;
  regulator: string;
};

// Regulator names are starting points from the build guide, not verified legal advice.
// Do not publish destination-specific compliance claims until a qualified reviewer checks them.
export const countries: Country[] = [
  { slug: "united-states", name: "United States", regulator: "FDA (TODO: verify)" },
  { slug: "united-kingdom", name: "United Kingdom", regulator: "MHRA (TODO: verify)" },
  { slug: "south-africa", name: "South Africa", regulator: "SAHPRA (TODO: verify)" },
  { slug: "brazil", name: "Brazil", regulator: "ANVISA (TODO: verify)" },
  { slug: "germany", name: "Germany", regulator: "BfArM (TODO: verify)" },
  { slug: "nigeria", name: "Nigeria", regulator: "NAFDAC (TODO: verify)" },
  { slug: "netherlands", name: "Netherlands", regulator: "CBG-MEB (TODO: verify)" },
  { slug: "france", name: "France", regulator: "ANSM (TODO: verify)" },
  { slug: "canada", name: "Canada", regulator: "Health Canada (TODO: verify)" },
  { slug: "australia", name: "Australia", regulator: "TGA (TODO: verify)" },
  { slug: "ireland", name: "Ireland", regulator: "HPRA (TODO: verify)" },
  { slug: "poland", name: "Poland", regulator: "URPL (TODO: verify)" },
  { slug: "kenya", name: "Kenya", regulator: "Pharmacy and Poisons Board (TODO: verify)" },
  { slug: "uae", name: "United Arab Emirates", regulator: "Emirates Drug Establishment (TODO: verify)" },
];
