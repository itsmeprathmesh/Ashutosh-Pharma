import { LegalPlaceholder } from "@/components/LegalPlaceholder";

export const metadata = { title: "Website terms", description: "Terms for using the Ashutosh Pharma trade enquiry website.", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return <LegalPlaceholder title="Terms of use" purpose="Website and trade enquiry terms" />;
}
